import { CommonModule } from "@angular/common";
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
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ButtonComponent],
    template: `
    <div class="dialog-actions">
      <app-button variant="text" (clicked)="cancel.emit()">
        {{ cancelLabel() }}
      </app-button>
      <app-button
        [icon]="primaryIcon()"
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
    styles: [],
})
export class DialogFooterComponent {
    /**
     * Cancel button label text
     */
    cancelLabel = input<string>("Cancel");

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
}
