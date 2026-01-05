/**
 * Success Checkmark Component
 *
 * Animated success checkmark with optional circle background.
 * Used for form submissions, completed actions, and achievements.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export type SuccessSize = "sm" | "md" | "lg" | "xl";
export type SuccessVariant = "default" | "filled" | "outlined" | "minimal";

@Component({
  selector: "app-success-checkmark",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="success-checkmark-container"
      [class]="containerClass()"
      [class.animated]="animate()"
      [class.visible]="isVisible()"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <!-- Circle background -->
      @if (showCircle()) {
        <div class="success-circle" [class.pulse]="pulse()"></div>
      }

      <!-- Checkmark SVG -->
      <svg
        class="checkmark-svg"
        viewBox="0 0 52 52"
        [attr.width]="svgSize()"
        [attr.height]="svgSize()"
      >
        @if (variant() === "filled" || variant() === "outlined") {
          <circle
            class="checkmark-circle"
            cx="26"
            cy="26"
            r="25"
            [class.filled]="variant() === 'filled'"
          />
        }
        <path
          class="checkmark-check"
          fill="none"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
        />
      </svg>

      <!-- Optional label -->
      @if (label()) {
        <span class="success-label">{{ label() }}</span>
      }
    </div>
  `,
  styleUrl: "./success-checkmark.component.scss",
})
export class SuccessCheckmarkComponent implements OnInit, OnDestroy {
  // Inputs
  size = input<SuccessSize>("md");
  variant = input<SuccessVariant>("default");
  color = input<"primary" | "success" | "white">("primary");
  animate = input<boolean>(true);
  showCircle = input<boolean>(true);
  pulse = input<boolean>(false);
  label = input<string>("");
  ariaLabel = input<string>("Success");
  autoHide = input<boolean>(false);
  autoHideDelay = input<number>(3000);

  // Outputs
  hidden = output<void>();
  animationComplete = output<void>();

  // Internal state
  isVisible = signal(false);
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  // Computed
  containerClass = computed(() => {
    return [
      `size-${this.size()}`,
      `variant-${this.variant()}`,
      `color-${this.color()}`,
    ].join(" ");
  });

  svgSize = computed(() => {
    const sizes: Record<SuccessSize, number> = {
      sm: 32,
      md: 48,
      lg: 64,
      xl: 96,
    };
    return sizes[this.size()];
  });

  ngOnInit(): void {
    // Trigger visibility after a small delay for animation
    setTimeout(() => {
      this.isVisible.set(true);

      // Emit animation complete after animations finish
      if (this.animate()) {
        setTimeout(() => {
          this.animationComplete.emit();
        }, 700);
      }
    }, 50);

    // Auto-hide if enabled
    if (this.autoHide()) {
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, this.autoHideDelay());
    }
  }

  ngOnDestroy(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  /**
   * Show the checkmark
   */
  show(): void {
    this.isVisible.set(true);
  }

  /**
   * Hide the checkmark
   */
  hide(): void {
    this.isVisible.set(false);
    this.hidden.emit();
  }

  /**
   * Reset and replay the animation
   */
  replay(): void {
    this.isVisible.set(false);
    setTimeout(() => {
      this.isVisible.set(true);
    }, 50);
  }
}
