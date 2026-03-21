import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, computed } from "@angular/core";
import { ProgressBarModule } from "primeng/progressbar";

@Component({
  selector: "app-progress-bar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProgressBarModule],
  template: `
    <div class="app-progress-bar-wrapper w-full">
      <p-progressBar
        [value]="value()"
        [showValue]="showValue()"
        [unit]="unit()"
        [styleClass]="'app-pb ' + styleClass() + ' ' + severityClass()"
      ></p-progressBar>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    :host ::ng-deep .p-progressbar {
      height: 0.5rem;
      border-radius: 999px;
      background: var(--surface-200);
    }
    :host ::ng-deep .p-progressbar-value {
      border-radius: 999px;
    }
    /* Severity overrides using design tokens if needed */
    :host ::ng-deep .app-pb-success .p-progressbar-value {
      background: var(--color-status-success);
    }
    :host ::ng-deep .app-pb-warning .p-progressbar-value {
      background: var(--primitive-warning-500);
    }
    :host ::ng-deep .app-pb-danger .p-progressbar-value {
      background: var(--primitive-error-500);
    }
    :host ::ng-deep .app-pb-info .p-progressbar-value {
      background: var(--color-status-info);
    }
  `]
})
export class ProgressBarComponent {
  value = input.required<number>();
  showValue = input(true);
  unit = input("%");
  styleClass = input("");
  severity = input<"success" | "warning" | "danger" | "info" | "primary">("info");

  severityClass = computed(() => `app-pb-${this.severity()}`);
}
