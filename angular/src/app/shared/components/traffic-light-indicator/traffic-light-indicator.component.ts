import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export type TrafficLightStatus = "green" | "yellow" | "red" | "orange" | "gray";

@Component({
  selector: "app-traffic-light-indicator",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="traffic-light-container">
      <div class="traffic-light" [class]="statusClass()">
        <div class="light green" [class.active]="status() === 'green'"></div>
        <div class="light yellow" [class.active]="status() === 'yellow'"></div>
        <div class="light orange" [class.active]="status() === 'orange'"></div>
        <div class="light red" [class.active]="status() === 'red'"></div>
        <div class="light gray" [class.active]="status() === 'gray'"></div>
      </div>
      @if (showLabel()) {
        <div class="label" [class]="statusClass()">
          {{ label() }}
        </div>
      }
    </div>
  `,
  styleUrl: "./traffic-light-indicator.component.scss",
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
      gray: "No Data",
    };
    return labels[this.status()] || "Unknown";
  });
}
