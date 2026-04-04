import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { CloseButtonComponent } from "../close-button/close-button.component";

export type AlertVariant = "info" | "success" | "warning" | "error";
export type AlertDensity = "default" | "compact";

@Component({
  selector: "app-alert",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CloseButtonComponent],
  template: `
    <div
      [class]="alertClasses()"
      [attr.role]="role()"
      [attr.aria-live]="ariaLive()"
      aria-atomic="true"
    >
      <div class="app-alert__icon" aria-hidden="true">
        <i [class]="iconClass()"></i>
      </div>

      <div class="app-alert__body">
        @if (title()) {
          <p class="app-alert__title">{{ title() }}</p>
        }

        @if (message()) {
          <p class="app-alert__message">{{ message() }}</p>
        }

        <ng-content></ng-content>
      </div>

      @if (dismissible()) {
        <app-close-button
          ariaLabel="Dismiss alert"
          size="sm"
          [styleClass]="'app-alert__dismiss'"
          (clicked)="dismissed.emit()"
        />
      }
    </div>
  `,
})
export class AlertComponent {
  variant = input<AlertVariant>("info");
  density = input<AlertDensity>("default");
  title = input("");
  message = input("");
  icon = input<string | null>(null);
  dismissible = input(false);
  styleClass = input("");

  dismissed = output<void>();

  readonly alertClasses = computed(() =>
    [
      "app-alert",
      `app-alert--${this.variant()}`,
      this.density() === "compact" ? "app-alert--compact" : "",
      this.styleClass(),
    ]
      .filter(Boolean)
      .join(" "),
  );

  readonly role = computed(() =>
    this.variant() === "error" || this.variant() === "warning"
      ? "alert"
      : "status",
  );

  readonly ariaLive = computed(() =>
    this.variant() === "error" ? "assertive" : "polite",
  );

  readonly iconClass = computed(() => {
    if (this.icon()) {
      return `pi ${this.icon()}`;
    }

    const iconMap: Record<AlertVariant, string> = {
      info: "pi pi-info-circle",
      success: "pi pi-check-circle",
      warning: "pi pi-exclamation-triangle",
      error: "pi pi-times-circle",
    };
    return iconMap[this.variant()];
  });
}
