import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { CloseButtonComponent } from "../close-button/close-button.component";

/**
 * Dialog Header Component
 *
 * Reusable header for PrimeNG dialogs with icon, title, subtitle, and close button.
 * Preserves existing class structure from Settings dialogs.
 *
 * @example Basic usage
 * ```html
 * <app-dialog-header
 *   icon="lock"
 *   title="Change Password"
 *   subtitle="Update your account password"
 *   (close)="showDialog = false"
 * />
 * ```
 *
 * @example Danger variant
 * ```html
 * <app-dialog-header
 *   icon="trash"
 *   title="Delete Account"
 *   subtitle="This action is permanent and irreversible"
 *   [danger]="true"
 *   (close)="showDialog = false"
 * />
 * ```
 */
@Component({
  selector: "app-dialog-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CloseButtonComponent],
  template: `
    <div class="dialog-header" [class.danger-header]="danger()">
      <div class="dialog-icon" [class.danger-icon]="danger()">
        <i [class]="'pi pi-' + icon()"></i>
      </div>
      <div class="dialog-title-section">
        <h2>{{ title() }}</h2>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
      </div>
      <app-close-button
        ariaLabel="Close dialog"
        [styleClass]="'dialog-close-btn'"
        (clicked)="close.emit()"
      />
    </div>
  `,
  styles: [],
})
export class DialogHeaderComponent {
  /**
   * PrimeIcon name (without 'pi-' prefix)
   * Example: 'lock', 'trash', 'shield'
   */
  icon = input.required<string>();

  /**
   * Dialog title text
   */
  title = input.required<string>();

  /**
   * Optional subtitle/description text
   */
  subtitle = input<string>("");

  /**
   * Danger mode (red styling for destructive actions)
   */
  danger = input<boolean>(false);

  /**
   * Emits when close button is clicked
   */
  close = output<void>();
}
