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
      (keydown.enter)="handleKeyPress($event)"
      (keydown.space)="handleKeyPress($event)"
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
          <span class="ripple" [style.left.px]="rippleX()" [style.top.px]="rippleY()"></span>
        }
      </div>

      <!-- RouterLink overlay -->
      @if (routerLink()) {
        <a [routerLink]="routerLink()" class="router-overlay" [attr.aria-hidden]="true"></a>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .action-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      background: var(--surface-primary);
      border: 1px solid var(--p-surface-200);
      border-radius: var(--radius-xl);
      cursor: pointer;
      overflow: hidden;
      transition: 
        transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 150ms ease,
        border-color 150ms ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .action-card:hover {
      border-color: var(--color-brand-primary);
      box-shadow: var(--shadow-md);
    }

    .action-card:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(var(--ds-primary-green-rgb), 0.3);
    }

    .action-card.pressed {
      transform: scale(0.97);
      box-shadow: var(--shadow-sm);
    }

    .action-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .action-card.compact {
      padding: var(--space-3);
      gap: var(--space-3);
    }

    /* Icon */
    .action-icon {
      position: relative;
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
      transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .compact .action-icon {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }

    .action-card:hover .action-icon {
      transform: scale(1.1);
    }

    .action-card.pressed .action-icon {
      transform: scale(0.95);
    }

    /* Icon colors */
    .icon-primary {
      background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%);
      color: white;
    }

    .icon-success {
      background: linear-gradient(135deg, var(--color-status-success) 0%, #34d399 100%);
      color: white;
    }

    .icon-warning {
      background: linear-gradient(135deg, var(--color-status-warning) 0%, #fbbf24 100%);
      color: white;
    }

    .icon-danger {
      background: linear-gradient(135deg, var(--color-status-error) 0%, #f87171 100%);
      color: white;
    }

    .icon-info {
      background: linear-gradient(135deg, var(--color-status-info) 0%, #38bdf8 100%);
      color: white;
    }

    .icon-purple {
      background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
      color: white;
    }

    .icon-orange {
      background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
      color: white;
    }

    /* Badge */
    .action-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: var(--color-status-error);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
    }

    /* Notification dot */
    .notification-dot {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: var(--color-status-error);
      border-radius: 50%;
      border: 2px solid var(--surface-primary);
      animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.8;
      }
    }

    /* Content */
    .action-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .action-label {
      font-size: var(--font-body-md);
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .compact .action-label {
      font-size: var(--font-body-sm);
    }

    .action-description {
      font-size: var(--font-body-sm);
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .compact .action-description {
      font-size: var(--font-body-xs);
    }

    /* Arrow */
    .action-arrow {
      color: var(--text-tertiary);
      transition: transform 200ms ease, color 200ms ease;
    }

    .action-card:hover .action-arrow {
      color: var(--color-brand-primary);
      transform: translateX(4px);
    }

    /* Ripple effect */
    .ripple-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .ripple {
      position: absolute;
      width: 100px;
      height: 100px;
      background: rgba(var(--ds-primary-green-rgb), 0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      animation: ripple-effect 600ms ease-out forwards;
    }

    @keyframes ripple-effect {
      to {
        transform: translate(-50%, -50%) scale(4);
        opacity: 0;
      }
    }

    /* Router overlay */
    .router-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    /* Color variants - card border on hover */
    .color-success:hover {
      border-color: var(--color-status-success);
    }

    .color-warning:hover {
      border-color: var(--color-status-warning);
    }

    .color-danger:hover {
      border-color: var(--color-status-error);
    }

    .color-info:hover {
      border-color: var(--color-status-info);
    }

    /* Touch optimizations */
    @media (hover: none) and (pointer: coarse) {
      .action-card:hover {
        transform: none;
        box-shadow: var(--shadow-sm);
      }

      .action-card:hover .action-icon {
        transform: none;
      }

      .action-card:hover .action-arrow {
        transform: none;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .action-card {
        transition: none;
      }

      .action-icon {
        transition: none;
      }

      .ripple {
        animation: none;
      }

      .notification-dot {
        animation: none;
      }
    }
  `],
})
export class ActionCardComponent {
  // Inputs
  icon = input.required<string>();
  label = input.required<string>();
  description = input<string>("");
  color = input<"primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange">("primary");
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
