import {
  Component,
  input,
  output,
  computed,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
/**
 * Card Shell Component - Unified Card Container
 *
 * This component enforces the Card Shell Contract v1.
 * It provides ONLY the shell/layout - content is feature-specific.
 *
 * CANONICAL REFERENCE: Player Dashboard cards
 * - Header: inline icon + title, NO background, NO separator
 * - Icon: raw icon (no container), --font-body-size, --color-brand-primary, opacity 0.85
 * - Title: --font-h2-size (18px), semibold, line-height-tight
 *
 * @see docs/CARD_SHELL_CONTRACT.md for full specification
 *
 * Features:
 * - Enforces design tokens (radius, shadow, padding, typography)
 * - Header with icon, title, and actions slots (NO subtitle in canonical pattern)
 * - Body slot (required)
 * - Footer slot (optional)
 * - Two density modes: default and compact
 * - Three state modes: default, interactive, disabled
 * - Token-driven hover and focus behaviors
 *
 * @example
 * <app-card-shell
 *   title="Today's Schedule"
 *   headerIcon="pi-calendar"
 * >
 *   <ng-container header-actions>
 *     <app-button variant="text" size="sm">View All</app-button>
 *   </ng-container>
 *
 *   <!-- Body content -->
 *   <div class="schedule-list">...</div>
 *
 *   <ng-container footer>
 *     <app-button variant="text" block>See Full Schedule</app-button>
 *   </ng-container>
 * </app-card-shell>
 */
@Component({
  selector: "app-card-shell",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <article
      [class]="shellClass()"
      [class.card-shell--hovered]="isHovered()"
      [class.card-shell--pressed]="isPressed()"
      [attr.tabindex]="state() === 'interactive' ? 0 : undefined"
      [attr.role]="state() === 'interactive' ? 'button' : 'article'"
      [attr.aria-disabled]="state() === 'disabled' ? 'true' : undefined"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (mousedown)="onMouseDown()"
      (mouseup)="onMouseUp()"
      (click)="handleClick($event)"
      (keydown.enter)="handleKeyPress($event)"
      (keydown.space)="handleKeyPress($event)"
    >
      <!-- Header (rendered if title exists or header-actions slot has content) -->
      @if (title() || hasHeaderSlot) {
        <header
          class="card-shell__header"
          [class.card-shell__header--compact]="density() === 'compact'"
        >
          <div class="card-shell__header-content">
            <!-- Leading Icon (optional) - CANONICAL: raw icon, no container -->
            @if (headerIcon()) {
              <span
                class="card-shell__header-icon"
                [class.card-shell__header-icon--compact]="
                  density() === 'compact'
                "
              >
                <i [class]="'pi ' + headerIcon()"></i>
              </span>
            }

            <!-- Title Block -->
            <div class="card-shell__header-text">
              @if (title()) {
                <h3 class="card-shell__title">{{ title() }}</h3>
              }
              @if (subtitle()) {
                <p class="card-shell__subtitle">{{ subtitle() }}</p>
              }
            </div>
          </div>

          <!-- Actions Slot (right-aligned) -->
          <div class="card-shell__header-actions">
            <ng-content select="[header-actions]"></ng-content>
          </div>
        </header>
      }

      <!-- Body (required) -->
      <div
        class="card-shell__body"
        [class.card-shell__body--compact]="density() === 'compact'"
        [class.card-shell__body--no-header]="!hasVisibleHeader"
        [class.card-shell__body--with-header]="hasVisibleHeader"
        [class.card-shell__body--flush]="flush()"
      >
        <ng-content></ng-content>
      </div>

      <!-- Footer (optional) -->
      @if (hasFooter()) {
        <footer
          class="card-shell__footer"
          [class.card-shell__footer--compact]="density() === 'compact'"
        >
          <ng-content select="[footer]"></ng-content>
        </footer>
      }
    </article>
  `,
  styleUrl: "./card-shell.component.scss",
})
export class CardShellComponent {
  // ============================================
  // INPUTS - Card Configuration
  // ============================================

  /** Card title (required for header to render) */
  title = input<string>();

  /** Card subtitle (optional, renders below title) */
  subtitle = input<string>();

  /** Leading icon class (e.g., "pi-calendar", "pi-chart-bar") */
  headerIcon = input<string>();

  /** Whether the card has a footer slot */
  hasFooter = input<boolean>(false);

  /** Density mode: default (16px padding) or compact (12px padding) */
  density = input<"default" | "compact">("default");

  /** State mode: default, interactive (clickable), or disabled */
  state = input<"default" | "interactive" | "disabled">("default");

  /** Visual tone for semantic card variants */
  tone = input<"default" | "success" | "warning" | "danger" | "brand">(
    "default",
  );

  /** Remove body padding (for flush content like tables) */
  flush = input<boolean>(false);

  // ============================================
  // OUTPUTS - Events
  // ============================================

  /** Emitted when interactive card is clicked */
  cardClick = output<MouseEvent>();

  // ============================================
  // INTERNAL STATE
  // ============================================

  isHovered = signal(false);
  isPressed = signal(false);
  hasHeaderSlot = false; // Set via content projection detection

  get hasVisibleHeader(): boolean {
    return Boolean(this.title() || this.hasHeaderSlot);
  }

  // ============================================
  // COMPUTED - Class Generation
  // ============================================

  shellClass = computed(() => {
    const classes = ["card-shell"];

    // Density
    if (this.density() === "compact") {
      classes.push("card-shell--compact");
    }

    // State
    if (this.state() === "interactive") {
      classes.push("card-shell--interactive");
    } else if (this.state() === "disabled") {
      classes.push("card-shell--disabled");
    }

    // Tone
    if (this.tone() !== "default") {
      classes.push(`card-shell--tone-${this.tone()}`);
    }

    return classes.join(" ");
  });

  // ============================================
  // EVENT HANDLERS
  // ============================================

  onMouseEnter(): void {
    if (this.state() !== "disabled") {
      this.isHovered.set(true);
    }
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
    this.isPressed.set(false);
  }

  onMouseDown(): void {
    if (this.state() === "interactive") {
      this.isPressed.set(true);
    }
  }

  onMouseUp(): void {
    this.isPressed.set(false);
  }

  handleClick(event: MouseEvent): void {
    if (this.state() === "interactive") {
      this.cardClick.emit(event);
    }
  }

  handleKeyPress(event: Event): void {
    if (this.state() === "interactive") {
      event.preventDefault();
      this.cardClick.emit(event as MouseEvent);
    }
  }
}
