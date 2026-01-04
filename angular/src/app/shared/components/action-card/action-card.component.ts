/**
 * Action Card Component
 *
 * Quick action buttons with premium feel and haptic-like feedback.
 * Perfect for dashboard quick actions, feature navigation, etc.
 *
 * Features:
 * - Press animation with scale effect
 * - Icon with gradient background
 * - Optional badge/notification count
 * - Keyboard accessible
 * - Touch-optimized
 *
 * @example
 * <app-action-card
 *   icon="pi-play"
 *   label="Start Workout"
 *   description="Begin today's training"
 *   color="primary"
 *   (actionClick)="startWorkout()"
 * />
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-action-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="action-card"
      [class]="'color-' + color()"
      [class.pressed]="isPressed()"
      [class.disabled]="disabled()"
      [class.compact]="compact()"
      [attr.tabindex]="disabled() ? -1 : 0"
      [attr.role]="routerLink() ? 'link' : 'button'"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-disabled]="disabled()"
      (mousedown)="onPress()"
      (mouseup)="onRelease()"
      (mouseleave)="onRelease()"
      (touchstart)="onPress()"
      (touchend)="onRelease()"
      (click)="handleClick($event)"
      (keydown.enter)="handleKeyPress($any($event))"
      (keydown.space)="handleKeyPress($any($event))"
    >
      <!-- Icon container -->
      <div class="action-icon" [class]="'icon-' + color()">
        <i [class]="'pi ' + icon()"></i>

        <!-- Badge -->
        @if (badge()) {
          <span class="action-badge">{{ badge() }}</span>
        }

        <!-- Notification dot -->
        @if (showNotification()) {
          <span class="notification-dot"></span>
        }
      </div>

      <!-- Content -->
      <div class="action-content">
        <span class="action-label">{{ label() }}</span>
        @if (description()) {
          <span class="action-description">{{ description() }}</span>
        }
      </div>

      <!-- Arrow indicator -->
      @if (showArrow()) {
        <div class="action-arrow">
          <i class="pi pi-chevron-right"></i>
        </div>
      }

      <!-- Ripple effect -->
      <div class="ripple-container">
        @if (showRipple()) {
          <span
            class="ripple"
            [style.left.px]="rippleX()"
            [style.top.px]="rippleY()"
          ></span>
        }
      </div>

      <!-- RouterLink overlay -->
      @if (routerLink()) {
        <a
          [routerLink]="routerLink()"
          class="router-overlay"
          [attr.aria-hidden]="true"
        ></a>
      }
    </div>
  `,
  styleUrl: './action-card.component.scss',
})
export class ActionCardComponent {
  // Inputs
  icon = input.required<string>();
  label = input.required<string>();
  description = input<string>("");
  color = input<
    "primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange"
  >("primary");
  badge = input<string | number | null>(null);
  showNotification = input<boolean>(false);
  showArrow = input<boolean>(true);
  disabled = input<boolean>(false);
  compact = input<boolean>(false);
  routerLink = input<string | null>(null);

  // Outputs
  actionClick = output<MouseEvent>();

  // State
  isPressed = signal(false);
  showRipple = signal(false);
  rippleX = signal(0);
  rippleY = signal(0);

  // Computed
  ariaLabel = computed(() => {
    const lbl = this.label();
    const desc = this.description();
    return desc ? `${lbl}: ${desc}` : lbl;
  });

  onPress(): void {
    if (!this.disabled()) {
      this.isPressed.set(true);
    }
  }

  onRelease(): void {
    this.isPressed.set(false);
  }

  handleClick(event: MouseEvent): void {
    if (this.disabled() || this.routerLink()) return;

    // Trigger ripple
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.rippleX.set(event.clientX - rect.left);
    this.rippleY.set(event.clientY - rect.top);
    this.showRipple.set(true);

    setTimeout(() => this.showRipple.set(false), 600);

    this.actionClick.emit(event);
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.actionClick.emit(event as unknown as MouseEvent);
  }
}
