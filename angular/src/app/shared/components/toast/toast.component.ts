import {
  Component,
  ChangeDetectionStrategy,
  input,
} from "@angular/core";
import { Toast } from "primeng/toast";

/**
 * Toast Component - Angular 21 + PrimeNG 21
 *
 * A wrapper around PrimeNG Toast. Place once in app root.
 * Features:
 * - Slide-in animations (PrimeNG 21 native CSS; deprecated showTransformOptions removed)
 * - Auto-dismiss with progress bar
 * - Multiple severity styles (success, info, warn, error)
 * - Stacked notifications with preventDuplicates
 */
@Component({
  selector: "app-toast",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Toast],
  template: `
    <p-toast
      [position]="position()"
      [class]="'app-toast ' + (styleClass() || '')"
      [baseZIndex]="baseZIndex()"
      [autoZIndex]="autoZIndex()"
      [key]="key()"
      [preventOpenDuplicates]="preventDuplicates()"
    >
      <ng-template let-message #message>
        <div class="toast-content">
          <div
            class="app-icon-box"
            [class]="'app-icon-box--' + message.severity"
          >
            <i [class]="getIcon(message.severity)"></i>
          </div>          <div class="toast-text">
            <div class="toast-summary">{{ message.summary }}</div>
            @if (message.detail) {
              <div class="toast-detail">{{ message.detail }}</div>
            }
          </div>
        </div>
      </ng-template>
    </p-toast>
  `,
  styleUrl: "./toast.component.scss",
})
export class ToastComponent {
  position = input<
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "center"
  >("top-right");
  styleClass = input<string>();
  baseZIndex = input<number>(10000);
  autoZIndex = input<boolean>(true);
  key = input<string>("app-toast");
  preventDuplicates = input<boolean>(true);

  getIcon(severity: string): string {
    const icons: Record<string, string> = {
      success: "pi pi-check-circle",
      info: "pi pi-info-circle",
      warn: "pi pi-exclamation-triangle",
      error: "pi pi-times-circle",
    };
    return icons[severity] || "pi pi-info-circle";
  }

  // UX AUDIT: Removed unused static methods (showSuccess, showError, showInfo, showWarning)
  // Use ToastService instead for all toast notifications - provides deduplication and consistency
}
