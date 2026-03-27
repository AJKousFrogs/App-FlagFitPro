import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  effect,
  signal,
  DestroyRef,
} from "@angular/core";

/**
 * Animate Number Directive
 * ========================
 *
 * Animates numbers with smooth counting effect for stats, dashboards, and metrics.
 * See Week 3 Phase 3A of v3.1 improvements.
 *
 * USAGE:
 *   <span [appAnimateNumber]="totalScore">0</span>
 *   <span [appAnimateNumber]="userCount" [animDuration]="1000">0</span>
 *   <span [appAnimateNumber]="percentage" [animDecimals]="1" [animSuffix]="'%'">0</span>
 *
 * INPUTS:
 *   appAnimateNumber  - Target number to animate to (required)
 *   animDuration      - Animation duration in ms (default: 800)
 *   animDecimals      - Number of decimal places (default: 0)
 *   animPrefix        - Text prefix (e.g., "$", "+")
 *   animSuffix        - Text suffix (e.g., "%", "pts", "K")
 *   animSeparator     - Thousands separator (default: ",")
 *   animEasing        - Easing function: "linear" | "ease-out" | "ease-in-out" (default: "ease-out")
 *   animAutoplay      - Start animation on mount (default: true)
 *
 * EXAMPLES:
 *   // Simple counter
 *   <h2 [appAnimateNumber]="totalPoints">0</h2>
 *
 *   // Currency with prefix
 *   <span [appAnimateNumber]="revenue" [animPrefix]="'$'" [animDecimals]="2">$0.00</span>
 *
 *   // Percentage with suffix
 *   <span [appAnimateNumber]="completion" [animSuffix]="'%'" [animDecimals]="1">0%</span>
 *
 *   // Large numbers with K/M suffix
 *   <span [appAnimateNumber]="followers" [animSuffix]="'K'">0K</span>
 *
 * ACCESSIBILITY:
 *   - Respects prefers-reduced-motion (instant value change)
 *   - Updates aria-live region with final value
 *   - Maintains semantic meaning for screen readers
 *
 * PERFORMANCE:
 *   - Uses requestAnimationFrame for smooth 60 FPS
 *   - Cancels animation on component destroy
 *   - Minimal DOM manipulation (single textContent update per frame)
 */
@Directive({
  selector: "[appAnimateNumber]",
  standalone: true,
})
export class AnimateNumberDirective implements OnInit, OnChanges {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  // Input signals
  @Input({ required: true }) appAnimateNumber!: number;
  @Input() animDuration = 800; // ms
  @Input() animDecimals = 0;
  @Input() animPrefix = "";
  @Input() animSuffix = "";
  @Input() animSeparator = ",";
  @Input() animEasing: "linear" | "ease-out" | "ease-in-out" = "ease-out";
  @Input() animAutoplay = true;

  private animationFrameId: number | null = null;
  private startValue = 0;
  private startTime = 0;
  private prefersReducedMotion = signal(false);

  ngOnInit(): void {
    this.initReducedMotionPreference();
    this.setupAccessibility();

    if (this.animAutoplay) {
      this.startAnimation();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Animate to new value when target changes
    if (
      changes["appAnimateNumber"] &&
      !changes["appAnimateNumber"].firstChange
    ) {
      this.startAnimation();
    }
  }

  private initReducedMotionPreference(): void {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.prefersReducedMotion.set(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => {
      this.prefersReducedMotion.set(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);
    this.destroyRef.onDestroy(() => {
      mediaQuery.removeEventListener("change", onChange);
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
      }
    });
  }

  private setupAccessibility(): void {
    // Set aria-live for screen reader announcements
    if (!this.el.nativeElement.hasAttribute("aria-live")) {
      this.el.nativeElement.setAttribute("aria-live", "polite");
    }

    // Ensure semantic meaning is preserved
    if (!this.el.nativeElement.hasAttribute("role")) {
      this.el.nativeElement.setAttribute("role", "status");
    }
  }

  private startAnimation(): void {
    // Cancel existing animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // If reduced motion, instantly set final value
    if (this.prefersReducedMotion()) {
      this.updateDisplay(this.appAnimateNumber);
      return;
    }

    // Get current value from DOM (for smooth transitions when value changes mid-animation)
    const currentText = this.el.nativeElement.textContent || "0";
    const currentNumber = parseFloat(
      currentText.replace(this.animPrefix, "").replace(this.animSuffix, "").replace(/,/g, ""),
    );

    this.startValue = isNaN(currentNumber) ? 0 : currentNumber;
    this.startTime = performance.now();

    this.animate();
  }

  private animate(): void {
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.animDuration, 1);

    // Apply easing function
    const easedProgress = this.applyEasing(progress);

    // Calculate current value
    const currentValue =
      this.startValue +
      (this.appAnimateNumber - this.startValue) * easedProgress;

    this.updateDisplay(currentValue);

    // Continue animation if not complete
    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } else {
      this.animationFrameId = null;
      // Ensure final value is exact (avoid floating point errors)
      this.updateDisplay(this.appAnimateNumber);
    }
  }

  private applyEasing(t: number): number {
    switch (this.animEasing) {
      case "linear":
        return t;
      case "ease-out":
        // Cubic ease-out: fast start, slow end
        return 1 - Math.pow(1 - t, 3);
      case "ease-in-out":
        // Cubic ease-in-out: slow start, fast middle, slow end
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default:
        return t;
    }
  }

  private updateDisplay(value: number): void {
    const formatted = this.formatNumber(value);
    this.el.nativeElement.textContent =
      this.animPrefix + formatted + this.animSuffix;
  }

  private formatNumber(value: number): string {
    // Round to specified decimals
    const rounded =
      this.animDecimals === 0
        ? Math.round(value)
        : parseFloat(value.toFixed(this.animDecimals));

    // Convert to string with decimals
    const parts = rounded.toFixed(this.animDecimals).split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add thousands separator
    const withSeparator = this.animSeparator
      ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, this.animSeparator)
      : integerPart;

    // Combine integer and decimal parts
    return decimalPart ? `${withSeparator}.${decimalPart}` : withSeparator;
  }
}
