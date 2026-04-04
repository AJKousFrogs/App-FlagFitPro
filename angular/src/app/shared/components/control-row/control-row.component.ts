import { Component, ChangeDetectionStrategy, input } from "@angular/core";
/**
 * Control Row Component
 *
 * A reusable horizontal control row for Settings-style layouts.
 * Displays label/description on the left, control (toggle, select, button) on the right.
 *
 * Usage:
 * ```html
 * <app-control-row
 *   icon="envelope"
 *   title="Email Notifications"
 *   description="Receive updates via email"
 * >
 *   <p-toggleswitch formControlName="emailNotifications"></p-toggleswitch>
 * </app-control-row>
 * ```
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */
@Component({
  selector: "app-control-row",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="notification-item control-row">
      <div class="notification-info control-row__label">
        @if (icon()) {
          <div class="notification-icon">
            <i [class]="'pi pi-' + icon()"></i>
          </div>
        }
        <div class="notification-text">
          <span class="notification-label control-row__title">{{
            title()
          }}</span>
          @if (description()) {
            <span class="notification-desc control-row__description">
              {{ description() }}
            </span>
          }
        </div>
      </div>
      <div class="toggle-wrapper control-row__control">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .control-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0;
      min-height: 2.75rem;
    }
    .control-row__label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }
    .notification-icon {
      flex-shrink: 0;
      width: 1.25rem;
      text-align: center;
      color: var(--color-text-tertiary, #667085);
    }
    .notification-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }
    .notification-label {
      font-size: var(--ds-font-size-sm, 0.875rem);
      font-weight: var(--ds-font-weight-semibold, 600);
      color: var(--color-text-primary, #0f1728);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .notification-desc {
      font-size: var(--ds-font-size-xs, 0.75rem);
      color: var(--color-text-tertiary, #667085);
    }
    .control-row__control {
      flex-shrink: 0;
    }
  `]
})
export class ControlRowComponent {
  /**
   * Optional icon name (without 'pi-' prefix)
   * Example: "envelope", "bell", "lock"
   */
  icon = input<string>("");

  /**
   * Primary label text (required)
   */
  title = input.required<string>();

  /**
   * Optional description text below the title
   */
  description = input<string>("");
}
