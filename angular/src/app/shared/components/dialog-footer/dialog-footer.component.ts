import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import type { ButtonVariant } from "../button/button.component";
import { ButtonComponent } from "../button/button.component";

/**
 * Dialog Footer Component
 *
 * Reusable footer for PrimeNG dialogs with Cancel + Primary action buttons.
 * Preserves existing class structure from Settings dialogs.
 *
 * @example Basic usage
 * ```html
 * <app-dialog-footer
 *   cancelLabel="Cancel"
 *   primaryLabel="Save Changes"
 *   primaryIcon="check"
 *   [loading]="isSaving()"
 *   [disabled]="form.invalid"
 *   (cancel)="closeDialog()"
 *   (primary)="saveChanges()"
 * />
 * ```
 *
 * @example Danger action
 * ```html
 * <app-dialog-footer
 *   cancelLabel="Cancel"
 *   primaryLabel="Delete Account"
 *   primaryIcon="trash"
 *   primaryVariant="danger"
 *   [loading]="isDeleting()"
 *   (cancel)="closeDialog()"
 *   (primary)="deleteAccount()"
 * />
 * ```
 */
@Component({
  selector: "app-dialog-footer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="dialog-actions">
      <ng-content select="[dialogFooterStart]"></ng-content>
      @if (showCancel()) {
        <app-button variant="text" (clicked)="cancel.emit()">
          {{ cancelLabel() }}
        </app-button>
      }
      @if (secondaryLabel()) {
        <app-button
          [iconLeft]="secondaryIcon()"
          [variant]="secondaryVariant()"
          [disabled]="secondaryDisabled()"
          (clicked)="secondary.emit()"
        >
          {{ secondaryLabel() }}
        </app-button>
      }
      <app-button
        [iconLeft]="primaryIcon()"
        [variant]="primaryVariant()"
        [loading]="loading()"
        [disabled]="disabled()"
        [fullWidth]="fullWidthPrimary()"
        (clicked)="primary.emit()"
      >
        {{ primaryLabel() }}
      </app-button>
    </div>
  `,
})
export class DialogFooterComponent {
  /**
   * Cancel button label text
   */
  cancelLabel = input<string>("Cancel");

  /**
   * Whether to show the secondary cancel button.
   */
  showCancel = input<boolean>(true);

  /**
   * Optional secondary action label.
   */
  secondaryLabel = input<string>("");

  /**
   * Optional icon for the secondary button.
   */
  secondaryIcon = input<string>("");

  /**
   * Visual variant for the secondary action.
   */
  secondaryVariant = input<ButtonVariant>("secondary");

  /**
   * Disabled state for secondary action.
   */
  secondaryDisabled = input<boolean>(false);

  /**
   * Primary action button label text (required)
   */
  primaryLabel = input.required<string>();

  /**
   * Optional icon for primary button (PrimeIcon name without 'pi-' prefix)
   * Example: 'check', 'trash', 'send'
   */
  primaryIcon = input<string>("");

  /**
   * Visual variant for primary button
   * Defaults to 'primary' (filled blue button)
   */
  primaryVariant = input<ButtonVariant>("primary");

  /**
   * Loading state for primary button
   */
  loading = input<boolean>(false);

  /**
   * Disabled state for primary button
   */
  disabled = input<boolean>(false);

  /**
   * Make primary button full width (useful for mobile)
   */
  fullWidthPrimary = input<boolean>(false);

  /**
   * Emits when cancel button is clicked
   */
  cancel = output<void>();

  /**
   * Emits when primary button is clicked
   */
  primary = output<void>();

  /**
   * Emits when the secondary button is clicked.
   */
  secondary = output<void>();
}
