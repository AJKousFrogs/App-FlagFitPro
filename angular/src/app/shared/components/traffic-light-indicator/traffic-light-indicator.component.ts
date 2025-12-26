import { Component, input, computed } from "@angular/core";
import { CommonModule } from "@angular/common";

export type TrafficLightStatus = "green" | "yellow" | "red" | "orange";

@Component({
  selector: "app-traffic-light-indicator",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="traffic-light-container">
      <div class="traffic-light" [class]="statusClass()">
        <div class="light green" [class.active]="status() === 'green'"></div>
        <div class="light yellow" [class.active]="status() === 'yellow'"></div>
        <div class="light orange" [class.active]="status() === 'orange'"></div>
        <div class="light red" [class.active]="status() === 'red'"></div>
      </div>
      @if (showLabel()) {
        <div class="label" [class]="statusClass()">
          {{ label() }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .traffic-light-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
      }

      .traffic-light {
        width: 24px;
        height: 64px;
        background: var(--color-neutral-800);
        border-radius: var(--radius-xl);
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: var(--shadow-sm);
      }

      .light {
        flex: 1;
        border-radius: var(--radius-full);
        opacity: 0.3;
        transition:
          opacity var(--transition-base),
          box-shadow var(--transition-base);
      }

      .light.active {
        opacity: 1;
        box-shadow: 0 0 12px currentColor;
      }

      .light.green {
        background: var(--color-status-success);
      }

      .light.yellow {
        background: var(--color-status-warning);
      }

      .light.orange {
        background: var(--color-status-warning);
      }

      .light.red {
        background: var(--color-status-error);
      }

      .label {
        font-size: var(--text-xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .label.green {
        color: var(--color-status-success);
      }

      .label.yellow {
        color: var(--color-status-warning);
      }

      .label.orange {
        color: var(--color-status-warning);
      }

      .label.red {
        color: var(--color-status-error);
      }
    `,
  ],
})
export class TrafficLightIndicatorComponent {
  // Angular 21: Use input() signal instead of @Input()
  status = input<TrafficLightStatus>("green");
  labelText = input<string>("");
  showLabel = input<boolean>(true);

  statusClass = computed(() => this.status());

  label = computed(() => {
    if (this.labelText()) return this.labelText();
    const labels: Record<TrafficLightStatus, string> = {
      green: "Good",
      yellow: "Caution",
      orange: "Warning",
      red: "Alert",
    };
    return labels[this.status()] || "Unknown";
  });
}
