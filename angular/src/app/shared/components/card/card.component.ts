import {
  Component,
  input,
  output,
  computed,
  signal,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  afterNextRender,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Card Component - Angular 21 Premium Edition
 *
 * A versatile card component with multiple variants and premium interactions
 * Uses Angular 21 signals for reactive state management
 * Features:
 * - Hover lift animation
 * - Interactive press feedback
 * - Gradient accent bar
 * - Skeleton loading state
 * - Stagger animation support
 */
@Component({
  selector: "app-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div 
      [class]="cardClass()"
      [class.card-hovered]="isHovered()"
      [class.card-pressed]="isPressed()"
      [class.card-loading]="loading()"
      [attr.tabindex]="clickable() ? 0 : undefined"
      [attr.role]="clickable() ? 'button' : undefined"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (mousedown)="onMouseDown()"
      (mouseup)="onMouseUp()"
      (click)="handleClick($event)"
      (keydown.enter)="handleKeyPress($event)"
      (keydown.space)="handleKeyPress($event)"
    >
      <!-- Accent bar for session/feature cards -->
      @if (showAccent()) {
        <div class="card-accent" [style.background]="accentGradient()"></div>
      }

      <!-- Skeleton loading overlay -->
      @if (loading()) {
        <div class="card-skeleton-overlay">
          <div class="skeleton-shimmer"></div>
        </div>
      }

      <!-- Card header -->
      @if (title() || subtitle() || hasHeaderContent) {
        <div class="card-header" [class.card-header-compact]="compact()">
          <div class="card-header-content">
            @if (headerIcon()) {
              <div class="card-header-icon" [class]="'icon-' + headerIconColor()">
                <i [class]="'pi ' + headerIcon()"></i>
              </div>
            }
            <div class="card-header-text">
              @if (title()) {
                <h3 class="card-title">{{ title() }}</h3>
              }
              @if (subtitle()) {
                <p class="card-subtitle">{{ subtitle() }}</p>
              }
            </div>
          </div>
          <div class="card-header-actions">
            <ng-content select="[header-actions]"></ng-content>
          </div>
        </div>
      }

      <!-- Card body -->
      <div class="card-body" [class.card-body-compact]="compact()" [class.card-body-flush]="flush()">
        <ng-content></ng-content>
      </div>

      <!-- Card footer -->
      @if (hasFooter()) {
        <div class="card-footer" [class.card-footer-compact]="compact()">
          <ng-content select="[footer]"></ng-content>
        </div>
      }

      <!-- Interactive overlay for clickable cards -->
      @if (clickable()) {
        <div class="card-interactive-overlay"></div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .card {
        position: relative;
        display: flex;
        flex-direction: column;
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        overflow: hidden;
        
        /* Premium transition */
        transition: 
          transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 200ms cubic-bezier(0.25, 0.1, 0.25, 1),
          border-color 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
        will-change: transform, box-shadow;
      }

      /* ================================
         VARIANTS
         ================================ */

      /* Default Card */
      .card-default {
        border: 1px solid var(--color-border-secondary);
        box-shadow: var(--shadow-sm);
      }

      @media (hover: hover) and (pointer: fine) {
        .card-default:hover {
          box-shadow: var(--shadow-md);
          border-color: rgba(var(--ds-primary-green-rgb), 0.2);
        }
      }

      /* Elevated Card */
      .card-elevated {
        border: 1px solid var(--color-border-subtle);
        box-shadow: var(--shadow-md);
      }

      @media (hover: hover) and (pointer: fine) {
        .card-elevated:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 12px 40px -10px rgba(0, 0, 0, 0.15),
            0 4px 15px -5px rgba(0, 0, 0, 0.1);
        }
      }

      /* Outlined Card */
      .card-outlined {
        border: 2px solid var(--color-border-primary);
        box-shadow: none;
      }

      @media (hover: hover) and (pointer: fine) {
        .card-outlined:hover {
          border-color: var(--ds-primary-green);
          box-shadow: var(--shadow-sm);
        }
      }

      /* Interactive Card */
      .card-interactive {
        border: 1px solid var(--color-border-secondary);
        box-shadow: var(--shadow-sm);
        cursor: pointer;
      }

      @media (hover: hover) and (pointer: fine) {
        .card-interactive:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 12px 40px -10px rgba(0, 0, 0, 0.15),
            0 4px 15px -5px rgba(0, 0, 0, 0.1);
          border-color: var(--ds-primary-green);
        }
      }

      .card-interactive:active,
      .card-interactive.card-pressed {
        transform: translateY(-2px) scale(0.99);
        box-shadow: var(--shadow-md);
      }

      .card-interactive:focus-visible {
        outline: 2px solid var(--ds-primary-green);
        outline-offset: 2px;
        box-shadow: 0 0 0 3px rgba(var(--ds-primary-green-rgb), 0.3);
      }

      .card-interactive:focus:not(:focus-visible) {
        outline: none;
      }

      /* Gradient Card */
      .card-gradient {
        background: linear-gradient(
          135deg,
          var(--ds-primary-green) 0%,
          var(--ds-primary-green-hover) 100%
        );
        color: var(--color-text-on-primary);
        border: none;
        box-shadow: 
          0 8px 30px rgba(var(--ds-primary-green-rgb), 0.3),
          0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .card-gradient .card-title,
      .card-gradient .card-subtitle {
        color: var(--color-text-on-primary);
      }

      .card-gradient .card-subtitle {
        opacity: 0.9;
      }

      .card-gradient .card-header,
      .card-gradient .card-footer {
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.1);
      }

      @media (hover: hover) and (pointer: fine) {
        .card-gradient:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 16px 50px rgba(var(--ds-primary-green-rgb), 0.4),
            0 6px 20px rgba(0, 0, 0, 0.15);
        }
      }

      /* Session Card (with accent bar) */
      .card-session {
        border: 1px solid var(--color-border-secondary);
        box-shadow: var(--shadow-sm);
      }

      @media (hover: hover) and (pointer: fine) {
        .card-session:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 12px 40px rgba(var(--ds-primary-green-rgb), 0.15),
            0 4px 15px rgba(0, 0, 0, 0.1);
          border-color: var(--ds-primary-green);
        }
      }

      /* Glass Card */
      .card-glass {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      @media (hover: hover) and (pointer: fine) {
        .card-glass:hover {
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }
      }

      /* ================================
         ACCENT BAR
         ================================ */

      .card-accent {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(
          90deg,
          var(--ds-primary-green) 0%,
          var(--ds-primary-green-light) 100%
        );
        z-index: 1;
      }

      /* ================================
         HEADER
         ================================ */

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-4);
        padding: var(--space-5);
        border-bottom: 1px solid var(--color-border-secondary);
        background: var(--surface-secondary);
      }

      .card-header-compact {
        padding: var(--space-4);
      }

      .card-header-content {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        flex: 1;
        min-width: 0;
      }

      .card-header-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-lg);
        font-size: 1.25rem;
        flex-shrink: 0;
        transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .card:hover .card-header-icon {
        transform: scale(1.1);
      }

      .icon-primary {
        background: var(--ds-primary-green-subtle);
        color: var(--ds-primary-green);
      }

      .icon-success {
        background: var(--color-status-success-light);
        color: var(--color-status-success);
      }

      .icon-warning {
        background: var(--color-status-warning-light);
        color: #92400e;
      }

      .icon-error {
        background: var(--color-status-error-light);
        color: var(--color-status-error);
      }

      .icon-info {
        background: var(--color-status-info-light);
        color: var(--color-status-info);
      }

      .card-header-text {
        flex: 1;
        min-width: 0;
      }

      .card-title {
        margin: 0;
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: 1.3;
      }

      .card-subtitle {
        margin: var(--space-1) 0 0 0;
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        line-height: 1.4;
      }

      .card-header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      /* ================================
         BODY
         ================================ */

      .card-body {
        padding: var(--space-5);
        flex: 1;
      }

      .card-body-compact {
        padding: var(--space-4);
      }

      .card-body-flush {
        padding: 0;
      }

      /* ================================
         FOOTER
         ================================ */

      .card-footer {
        padding: var(--space-4) var(--space-5);
        border-top: 1px solid var(--color-border-secondary);
        background: var(--surface-secondary);
      }

      .card-footer-compact {
        padding: var(--space-3) var(--space-4);
      }

      /* ================================
         LOADING STATE
         ================================ */

      .card-loading {
        pointer-events: none;
      }

      .card-skeleton-overlay {
        position: absolute;
        inset: 0;
        background: var(--surface-primary);
        z-index: 10;
        overflow: hidden;
      }

      .skeleton-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          var(--surface-secondary) 25%,
          var(--surface-tertiary) 50%,
          var(--surface-secondary) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      /* ================================
         INTERACTIVE OVERLAY
         ================================ */

      .card-interactive-overlay {
        position: absolute;
        inset: 0;
        background: transparent;
        transition: background-color 150ms ease;
        pointer-events: none;
      }

      .card-interactive:hover .card-interactive-overlay {
        background: rgba(var(--ds-primary-green-rgb), 0.02);
      }

      .card-interactive:active .card-interactive-overlay,
      .card-interactive.card-pressed .card-interactive-overlay {
        background: rgba(var(--ds-primary-green-rgb), 0.05);
      }

      /* ================================
         TOUCH DEVICE OPTIMIZATIONS
         ================================ */

      @media (hover: none) and (pointer: coarse) {
        .card-interactive:active,
        .card-elevated:active,
        .card-session:active {
          transform: scale(0.99);
        }
      }

      /* ================================
         REDUCED MOTION
         ================================ */

      @media (prefers-reduced-motion: reduce) {
        .card {
          transition: none;
        }

        .card-header-icon {
          transition: none;
        }

        .skeleton-shimmer {
          animation: none;
        }

        .card:hover,
        .card:active {
          transform: none;
        }
      }

      /* ================================
         DARK MODE ADJUSTMENTS
         ================================ */

      :host-context([data-theme="dark"]),
      :host-context(.dark-theme) {
        .card-glass {
          background: rgba(30, 30, 30, 0.8);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .card-glass:hover {
          background: rgba(40, 40, 40, 0.9);
        }
      }
    `,
  ],
})
export class CardComponent {
  private elementRef = inject(ElementRef);
  
  // Angular 21: Use input() signals instead of @Input()
  title = input<string>();
  subtitle = input<string>();
  variant = input<
    "default" | "elevated" | "outlined" | "interactive" | "gradient" | "session" | "glass"
  >("default");
  hasFooter = input<boolean>(false);
  compact = input<boolean>(false);
  flush = input<boolean>(false);
  loading = input<boolean>(false);
  clickable = input<boolean>(false);
  showAccent = input<boolean>(false);
  accentColor = input<string>("primary");
  headerIcon = input<string>("");
  headerIconColor = input<"primary" | "success" | "warning" | "error" | "info">("primary");
  
  // Events
  cardClick = output<MouseEvent>();

  // Internal state
  isHovered = signal(false);
  isPressed = signal(false);
  hasHeaderContent = false;

  // Computed values
  cardClass = computed(() => {
    const classes = ["card", `card-${this.variant()}`];
    return classes.join(" ");
  });

  accentGradient = computed(() => {
    const colorMap: Record<string, string> = {
      primary: "linear-gradient(90deg, var(--ds-primary-green) 0%, var(--ds-primary-green-light) 100%)",
      success: "linear-gradient(90deg, var(--color-status-success) 0%, #84cc16 100%)",
      warning: "linear-gradient(90deg, var(--color-status-warning) 0%, #fbbf24 100%)",
      error: "linear-gradient(90deg, var(--color-status-error) 0%, #f87171 100%)",
      info: "linear-gradient(90deg, var(--color-status-info) 0%, #38bdf8 100%)",
    };
    return colorMap[this.accentColor()] || colorMap['primary'];
  });

  constructor() {
    afterNextRender(() => {
      // Check if there's header action content
      const headerActions = this.elementRef.nativeElement.querySelector('[header-actions]');
      this.hasHeaderContent = !!headerActions?.childNodes.length;
    });
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
    this.isPressed.set(false);
  }

  onMouseDown(): void {
    if (this.clickable()) {
      this.isPressed.set(true);
    }
  }

  onMouseUp(): void {
    this.isPressed.set(false);
  }

  handleClick(event: MouseEvent): void {
    if (this.clickable()) {
      this.cardClick.emit(event);
    }
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (this.clickable()) {
      event.preventDefault();
      this.cardClick.emit(event as unknown as MouseEvent);
    }
  }
}
