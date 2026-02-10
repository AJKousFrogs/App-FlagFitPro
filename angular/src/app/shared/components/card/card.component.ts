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
import { COLORS } from "../../../core/constants/app.constants";

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
      (keydown.enter)="handleKeyPress($any($event))"
      (keydown.space)="handleKeyPress($any($event))"
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
              <div
                class="card-header-icon"
                [class]="'icon-' + headerIconColor()"
              >
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
      <div
        class="card-body"
        [class.card-body-compact]="compact()"
        [class.card-body-flush]="flush()"
      >
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
  styleUrl: "./card.component.scss",
})
export class CardComponent {
  private elementRef = inject(ElementRef);

  // Angular 21: Use input() signals instead of @Input()
  title = input<string>();
  subtitle = input<string>();
  variant = input<
    | "default"
    | "elevated"
    | "outlined"
    | "interactive"
    | "gradient"
    | "session"
  >("default");
  hasFooter = input<boolean>(false);
  compact = input<boolean>(false);
  flush = input<boolean>(false);
  loading = input<boolean>(false);
  clickable = input<boolean>(false);
  showAccent = input<boolean>(false);
  accentColor = input<string>("primary");
  headerIcon = input<string>("");
  headerIconColor = input<"primary" | "success" | "warning" | "error" | "info">(
    "primary",
  );

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
      primary:
        "linear-gradient(90deg, var(--ds-primary-green) 0%, var(--ds-primary-green-light) 100%)",
      success: `linear-gradient(90deg, var(--color-status-success) 0%, ${COLORS.SUCCESS_LIGHT} 100%)`,
      warning: `linear-gradient(90deg, var(--color-status-warning) 0%, ${COLORS.WARNING_LIGHT} 100%)`,
      error: `linear-gradient(90deg, var(--color-status-error) 0%, ${COLORS.ERROR_LIGHT} 100%)`,
      info: `linear-gradient(90deg, var(--color-status-info) 0%, ${COLORS.INFO_LIGHT} 100%)`,
    };
    return colorMap[this.accentColor()] || colorMap["primary"];
  });

  constructor() {
    afterNextRender(() => {
      // Check if there's header action content
      const headerActions =
        this.elementRef.nativeElement.querySelector("[header-actions]");
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
