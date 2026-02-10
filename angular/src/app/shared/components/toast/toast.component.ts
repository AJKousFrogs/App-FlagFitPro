import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MessageService } from "primeng/api";
import { Toast } from "primeng/toast";

/**
 *Component - Angular 21 Premium Edition
 *
 * A wrapper around PrimeNG with premium animations
 * Place this component once in your app root
 * Features:
 * - Slide-in animations
 * - Auto-dismiss with progress bar
 * - Multiple severity styles
 * - Stacked notifications
 */
@Component({
  selector: "app-toast",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Toast],
  providers: [MessageService],
  template: `
    <p-toast
      [position]="position()"
      [class]="'app-toast ' + (styleClass() || '')"
      [baseZIndex]="baseZIndex()"
      [autoZIndex]="autoZIndex()"
      [key]="key()"
      [preventOpenDuplicates]="preventDuplicates()"
      [showTransformOptions]="showTransformOptions()"
      [hideTransformOptions]="hideTransformOptions()"
    >
      <ng-template let-message #message>
        <div class="toast-content">
          <div
            class="toast-icon-wrapper"
            [class]="'toast-icon-' + message.severity"
          >
            <i [class]="getIcon(message.severity)"></i>
          </div>
          <div class="toast-text">
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
export class ToastComponent implements OnInit, OnDestroy {
  private messageService = inject(MessageService);

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
  showTransformOptions = input<string>("translateX(100%)");
  hideTransformOptions = input<string>("translateX(100%)");

  ngOnInit(): void {
    // Component initialized
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

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
