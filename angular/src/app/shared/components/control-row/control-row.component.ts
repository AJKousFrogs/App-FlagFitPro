import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { CommonModule } from "@angular/common";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
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
  styles: [],
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
