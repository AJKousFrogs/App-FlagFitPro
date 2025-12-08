import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TrafficLightStatus = 'green' | 'yellow' | 'red' | 'orange';

@Component({
  selector: 'app-traffic-light-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="traffic-light-container">
      <div class="traffic-light" [class]="statusClass()">
        <div class="light green" [class.active]="status === 'green'"></div>
        <div class="light yellow" [class.active]="status === 'yellow'"></div>
        <div class="light orange" [class.active]="status === 'orange'"></div>
        <div class="light red" [class.active]="status === 'red'"></div>
      </div>
      @if (showLabel) {
        <div class="label" [class]="statusClass()">
          {{ label() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .traffic-light-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .traffic-light {
      width: 24px;
      height: 64px;
      background: #2c3e50;
      border-radius: 12px;
      padding: 4px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .light {
      flex: 1;
      border-radius: 50%;
      opacity: 0.3;
      transition: opacity 0.3s ease, box-shadow 0.3s ease;
    }

    .light.active {
      opacity: 1;
      box-shadow: 0 0 12px currentColor;
    }

    .light.green {
      background: #22c55e;
    }

    .light.yellow {
      background: #eab308;
    }

    .light.orange {
      background: #f97316;
    }

    .light.red {
      background: #ef4444;
    }

    .label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .label.green {
      color: #22c55e;
    }

    .label.yellow {
      color: #eab308;
    }

    .label.orange {
      color: #f97316;
    }

    .label.red {
      color: #ef4444;
    }
  `]
})
export class TrafficLightIndicatorComponent {
  @Input() status: TrafficLightStatus = 'green';
  @Input() labelText: string = '';
  @Input() showLabel: boolean = true;

  currentStatus = computed(() => this.status);
  
  statusClass = computed(() => this.status);
  
  label = computed(() => {
    if (this.labelText) return this.labelText;
    const labels: Record<TrafficLightStatus, string> = {
      green: 'Good',
      yellow: 'Caution',
      orange: 'Warning',
      red: 'Alert'
    };
    return labels[this.status] || 'Unknown';
  });
}

