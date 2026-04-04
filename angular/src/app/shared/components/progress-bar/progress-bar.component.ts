import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
  ViewEncapsulation,
} from "@angular/core";
import { ProgressBarModule } from "primeng/progressbar";

@Component({
  selector: "app-progress-bar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: "app-progress-bar-host" },
  imports: [ProgressBarModule],
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
    .app-progress-bar-host {
      display: block;
      width: 100%;
    }
    .app-progress-bar-host .p-progressbar {
      height: var(--progress-md);
      border-radius: var(--radius-full);
      background: var(--surface-200);
    }
    .app-progress-bar-host .p-progressbar-value {
      border-radius: var(--radius-full);
      transition: width var(--transition-slow, 300ms) var(--ease-decelerate, cubic-bezier(0, 0, 0.2, 1));
    }
    .app-progress-bar-host .app-pb-primary .p-progressbar-value {
      background: var(--ds-primary-green);
    }
    .app-progress-bar-host .app-pb-success .p-progressbar-value {
      background: var(--color-status-success);
    }
    .app-progress-bar-host .app-pb-warning .p-progressbar-value {
      background: var(--primitive-warning-500);
    }
    .app-progress-bar-host .app-pb-danger .p-progressbar-value {
      background: var(--primitive-error-500);
    }
    .app-progress-bar-host .app-pb-info .p-progressbar-value {
      background: var(--color-status-info);
    }
  `]
})
export class ProgressBarComponent {
  value = input.required<number>();
  showValue = input(true);
  unit = input("%");
  styleClass = input("");
  severity = input<"success" | "warning" | "danger" | "info" | "primary">("primary");

  severityClass = computed(() => `app-pb-${this.severity()}`);
}
