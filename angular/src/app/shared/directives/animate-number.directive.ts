import {
  Directive,
  ElementRef,
  effect,
  input,
  signal,
  inject,
  DestroyRef,
  OnInit,
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
export class AnimateNumberDirective implements OnInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly appAnimateNumber = input.required<number>();
  readonly animDuration = input(800);
  readonly animDecimals = input(0);
  readonly animPrefix = input("");
  readonly animSuffix = input("");
  readonly animSeparator = input(",");
  readonly animEasing = input<"linear" | "ease-out" | "ease-in-out">("ease-out");
  readonly animAutoplay = input(true);

  private animationFrameId: number | null = null;
  private startValue = 0;
  private startTime = 0;
  private initialized = false;
  private prefersReducedMotion = signal(false);

  constructor() {
    // React to appAnimateNumber changes after initialization
    effect(() => {
      const target = this.appAnimateNumber();
      if (this.initialized) {
        this.startAnimation(target);
      }
    });
  }

  ngOnInit(): void {
    this.initReducedMotionPreference();
    this.setupAccessibility();

    if (this.animAutoplay()) {
      this.startAnimation(this.appAnimateNumber());
    }
    this.initialized = true;
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
    if (!this.el.nativeElement.hasAttribute("aria-live")) {
      this.el.nativeElement.setAttribute("aria-live", "polite");
    }

    if (!this.el.nativeElement.hasAttribute("role")) {
      this.el.nativeElement.setAttribute("role", "status");
    }
  }

  private startAnimation(target: number): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.prefersReducedMotion()) {
      this.updateDisplay(target);
      return;
    }

    const currentText = this.el.nativeElement.textContent || "0";
    const currentNumber = parseFloat(
      currentText.replace(this.animPrefix(), "").replace(this.animSuffix(), "").replace(/,/g, ""),
    );

    this.startValue = isNaN(currentNumber) ? 0 : currentNumber;
    this.startTime = performance.now();

    this.animate(target);
  }

  private animate(target: number): void {
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.animDuration(), 1);

    const easedProgress = this.applyEasing(progress);

    const currentValue =
      this.startValue +
      (target - this.startValue) * easedProgress;

    this.updateDisplay(currentValue);

    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(() => this.animate(target));
    } else {
      this.animationFrameId = null;
      this.updateDisplay(target);
    }
  }

  private applyEasing(t: number): number {
    switch (this.animEasing()) {
      case "linear":
        return t;
      case "ease-out":
        return 1 - Math.pow(1 - t, 3);
      case "ease-in-out":
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default:
        return t;
    }
  }

  private updateDisplay(value: number): void {
    const formatted = this.formatNumber(value);
    this.el.nativeElement.textContent =
      this.animPrefix() + formatted + this.animSuffix();
  }

  private formatNumber(value: number): string {
    const decimals = this.animDecimals();
    const rounded =
      decimals === 0
        ? Math.round(value)
        : parseFloat(value.toFixed(decimals));

    const parts = rounded.toFixed(decimals).split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];

    const separator = this.animSeparator();
    const withSeparator = separator
      ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      : integerPart;

    return decimalPart ? `${withSeparator}.${decimalPart}` : withSeparator;
  }
}
