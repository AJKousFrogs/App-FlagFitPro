import {
  Component,
  input,
  output,
  computed,
  signal,
  ChangeDetectionStrategy,
  HostBinding,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Button Component - Angular 21 Premium Edition
 *
 * A versatile button component with multiple variants, sizes, and premium interactions
 * Uses Angular 21 signals for reactive state management
 * Features:
 * - Ripple effect on click
 * - Hover lift animation
 * - Press feedback
 * - Loading state with spinner
 * - Icon support
 */
@Component({
  selector: "app-button",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <button
      [class]="buttonClass()"
      [disabled]="disabled() || loading()"
      [type]="type()"
      (click)="onClick($event)"
      (mousedown)="onMouseDown()"
      (mouseup)="onMouseUp()"
      (mouseleave)="onMouseUp()"
      [attr.aria-label]="ariaLabel() || undefined"
      [attr.aria-busy]="loading() || undefined"
      [attr.aria-disabled]="disabled() || undefined"
    >
      <!-- Ripple effect container -->
      <span class="btn-ripple-container">
        @for (ripple of ripples(); track ripple.id) {
          <span
            class="btn-ripple"
            [style.left.px]="ripple.x"
            [style.top.px]="ripple.y"
            [style.width.px]="ripple.size"
            [style.height.px]="ripple.size"
          ></span>
        }
      </span>

      <!-- Loading spinner -->
      @if (loading()) {
        <span class="btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="spinner-svg">
            <circle cx="12" cy="12" r="10" fill="none" stroke-width="3" />
          </svg>
        </span>
      }

      <!-- Icon (left) -->
      @if (icon() && iconPosition() === "left" && !loading()) {
        <i [class]="'btn-icon pi ' + icon()" aria-hidden="true"></i>
      }

      <!-- Button content -->
      <span
        class="btn-content"
        [class.btn-content-hidden]="loading() && !showLabelOnLoading()"
      >
        <ng-content></ng-content>
      </span>

      <!-- Icon (right) -->
      @if (icon() && iconPosition() === "right" && !loading()) {
        <i [class]="'btn-icon pi ' + icon()" aria-hidden="true"></i>
      }
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  // Angular 21: Use input() signals instead of @Input()
  variant = input<
    "primary" | "secondary" | "outlined" | "text" | "danger" | "success"
  >("primary");
  size = input<"sm" | "md" | "lg" | "xl">("md");
  disabled = input<boolean>(false);
  type = input<"button" | "submit" | "reset">("button");
  loading = input<boolean>(false);
  ariaLabel = input<string>("");
  icon = input<string>("");
  iconPosition = input<"left" | "right">("left");
  iconOnly = input<boolean>(false);
  rounded = input<boolean>(false);
  block = input<boolean>(false);
  showLabelOnLoading = input<boolean>(false);

  // Angular 21: Use output() signal instead of @Output() EventEmitter
  clicked = output<MouseEvent>();

  // Internal state
  isPressed = signal(false);
  ripples = signal<Array<{ id: number; x: number; y: number; size: number }>>(
    [],
  );
  private rippleId = 0;

  // Computed class string
  buttonClass = computed(() => {
    const classes = ["btn", `btn-${this.variant()}`];

    if (this.size() !== "md") {
      classes.push(`btn-${this.size()}`);
    }

    if (this.iconOnly()) {
      classes.push("btn-icon-only");
    }

    if (this.rounded()) {
      classes.push("btn-rounded");
    }

    if (this.block()) {
      classes.push("btn-block");
    }

    if (this.isPressed()) {
      classes.push("btn-pressed");
    }

    return classes.join(" ");
  });

  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.createRipple(event);
      this.clicked.emit(event);
    }
  }

  onMouseDown(): void {
    if (!this.disabled() && !this.loading()) {
      this.isPressed.set(true);
    }
  }

  onMouseUp(): void {
    this.isPressed.set(false);
  }

  private createRipple(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple = {
      id: this.rippleId++,
      x,
      y,
      size,
    };

    this.ripples.update((ripples) => [...ripples, ripple]);

    // Remove ripple after animation
    setTimeout(() => {
      this.ripples.update((ripples) =>
        ripples.filter((r) => r.id !== ripple.id),
      );
    }, 600);
  }
}
