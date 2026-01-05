import {
  Component,
  input,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Alert Component - Angular 21
 *
 * A feedback alert component with multiple types
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-alert",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (show()) {
      <div
        [class]="alertClass()"
        [attr.role]="'alert'"
        [attr.aria-live]="'polite'"
      >
        <div class="alert-content">
          @if (title()) {
            <h4 class="alert-title">{{ title() }}</h4>
          }
          <p class="alert-message">
            <ng-content></ng-content>
          </p>
        </div>
        @if (dismissible()) {
          <button
            class="alert-close"
            (click)="dismiss()"
            aria-label="Close alert"
            type="button"
          >
            <i class="pi pi-times"></i>
          </button>
        }
      </div>
    }
  `,
  styleUrl: "./alert.component.scss",
})
export class AlertComponent {
  // Angular 21: Use input() signals instead of @Input()
  type = input<"success" | "warning" | "error" | "info">("info");
  title = input<string>();
  dismissible = input<boolean>(false);

  // Show state
  show = signal<boolean>(true);

  // Computed class string
  alertClass = computed(() => `alert alert-${this.type()}`);

  dismiss(): void {
    this.show.set(false);
  }
}
