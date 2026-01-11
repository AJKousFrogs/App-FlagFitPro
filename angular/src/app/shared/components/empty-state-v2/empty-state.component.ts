import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Empty State V2 Component
 *
 * Simplified empty state display for when no data is available.
 * Shows icon, heading, optional description, optional tip, and projected action buttons.
 *
 * NOTE: This is a simpler version. The enhanced version with RouterLink support,
 * secondary actions, and benefits list is in `../empty-state/empty-state.component.ts`
 *
 * @example Basic usage
 * ```html
 * <app-empty-state-v2
 *   icon="calendar-plus"
 *   heading="No Training Plan Yet"
 *   description="Generate your personalized protocol to see exercises."
 * >
 *   <app-button (clicked)="generateProtocol()">Generate Protocol</app-button>
 * </app-empty-state-v2>
 * ```
 *
 * @example With tip
 * ```html
 * <app-empty-state-v2
 *   icon="inbox"
 *   heading="No Games Scheduled"
 *   description="You haven't scheduled any games yet."
 *   tip="Tip: Start by scheduling your first game"
 * >
 *   <app-button (clicked)="scheduleGame()">Schedule Game</app-button>
 * </app-empty-state-v2>
 * ```
 *
 * @example Compact mode
 * ```html
 * <app-empty-state-v2
 *   icon="chart-pie"
 *   heading="No data available"
 *   [compact]="true"
 * />
 * ```
 */
@Component({
  selector: "app-empty-state-v2",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="empty-state" [class.empty-state--compact]="compact()">
      <i [class]="'pi pi-' + icon()"></i>
      <h3>{{ heading() }}</h3>
      @if (description()) {
        <p>{{ description() }}</p>
      }
      @if (hasActions) {
        <div class="empty-state-actions">
          <ng-content></ng-content>
        </div>
      }
      @if (tip()) {
        <div class="empty-state-tip">
          <i class="pi pi-info-circle"></i>
          <span>{{ tip() }}</span>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class EmptyStateComponent {
  /**
   * PrimeIcon name (without 'pi-' prefix)
   * Example: 'calendar-plus', 'inbox', 'chart-pie'
   */
  icon = input.required<string>();

  /**
   * Heading text
   */
  heading = input.required<string>();

  /**
   * Optional description text
   */
  description = input<string>("");

  /**
   * Optional tip/hint text (displays at bottom with info icon)
   */
  tip = input<string>("");

  /**
   * Compact mode for smaller areas (reduces padding, smaller icon)
   */
  compact = input<boolean>(false);

  /**
   * Check if actions slot has content
   * Used to conditionally render actions wrapper
   */
  hasActions = true; // Simplified - wrapper will handle empty content
}
