import { Component, input, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RiskZone } from "../../../core/models/acwr.models";

@Component({
  selector: "app-traffic-light-risk",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="traffic-light-container">
      <!-- Main Traffic Light Display -->
      <div class="traffic-light" [class]="'risk-' + currentRisk().level">
        <div
          class="light red"
          [class.active]="currentRisk().level === 'danger-zone'"
        >
          <div class="light-glow"></div>
          <div class="light-label">Danger</div>
        </div>
        <div
          class="light yellow"
          [class.active]="currentRisk().level === 'elevated-risk'"
        >
          <div class="light-glow"></div>
          <div class="light-label">Caution</div>
        </div>
        <div
          class="light green"
          [class.active]="currentRisk().level === 'sweet-spot'"
        >
          <div class="light-glow"></div>
          <div class="light-label">Optimal</div>
        </div>
        <div
          class="light orange"
          [class.active]="currentRisk().level === 'under-training'"
        >
          <div class="light-glow"></div>
          <div class="light-label">Under</div>
        </div>
        <div
          class="light gray"
          [class.active]="currentRisk().level === 'no-data'"
        >
          <div class="light-glow"></div>
          <div class="light-label">No Data</div>
        </div>
      </div>

      <!-- Risk Zone Info -->
      <div class="risk-info" [class]="'info-' + currentRisk().level">
        <div class="risk-header">
          <h3 class="risk-title">{{ currentRisk().label }}</h3>
          <div class="acwr-value" [style.color]="currentRisk().color">
            {{ acwrValue() | number: "1.2-2" }}
          </div>
        </div>
        <p class="risk-description">{{ currentRisk().description }}</p>
        <div class="risk-recommendation">
          <strong>Recommendation:</strong> {{ currentRisk().recommendation }}
        </div>
      </div>

      <!-- Risk Zone Scale -->
      <div class="risk-scale">
        <div class="scale-bar">
          <div
            class="scale-segment segment-under"
            [style.width.%]="20"
            [class.active]="currentRisk().level === 'under-training'"
          >
            <span class="segment-label">&lt; 0.80</span>
          </div>
          <div
            class="scale-segment segment-sweet"
            [style.width.%]="50"
            [class.active]="currentRisk().level === 'sweet-spot'"
          >
            <span class="segment-label">0.80 - 1.30</span>
          </div>
          <div
            class="scale-segment segment-elevated"
            [style.width.%]="20"
            [class.active]="currentRisk().level === 'elevated-risk'"
          >
            <span class="segment-label">1.30 - 1.50</span>
          </div>
          <div
            class="scale-segment segment-danger"
            [style.width.%]="10"
            [class.active]="currentRisk().level === 'danger-zone'"
          >
            <span class="segment-label">&gt; 1.50</span>
          </div>
        </div>
        <div class="scale-marker" [style.left.%]="markerPosition()">
          <div class="marker-line"></div>
          <div class="marker-value">{{ acwrValue() | number: "1.2-2" }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .traffic-light-container {
        @apply flex flex-col items-center gap-6 p-6 bg-surface-primary rounded-lg shadow-medium;
      }

      .traffic-light {
        @apply flex flex-col items-center gap-3 p-6 bg-gray-900 rounded-full;
        width: 120px;
        position: relative;
      }

      .light {
        @apply w-16 h-16 rounded-full relative flex items-center justify-center;
        @apply opacity-30 transition-all duration-300;
        border: 3px solid rgba(255, 255, 255, 0.2);
      }

      .light.active {
        @apply opacity-100 shadow-lg;
        animation: pulse 2s infinite;
      }

      .light.red {
        @apply bg-red-600;
      }

      .light.yellow {
        @apply bg-yellow-500;
      }

      .light.green {
        @apply bg-green-500;
      }

      .light.orange {
        @apply bg-orange-500;
      }

      .light.gray {
        @apply bg-gray-500;
      }

      .light-glow {
        @apply absolute inset-0 rounded-full;
        box-shadow: 0 0 20px currentColor;
        opacity: 0;
        transition: opacity 0.3s;
      }

      .light.active .light-glow {
        opacity: 0.6;
      }

      .light-label {
        @apply text-white text-xs font-bold;
        z-index: 1;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      .risk-info {
        @apply w-full max-w-md p-6 rounded-lg border-2;
        @apply bg-surface-secondary;
      }

      .info-danger-zone {
        @apply border-red-500 bg-red-50;
      }

      .info-elevated-risk {
        @apply border-yellow-500 bg-yellow-50;
      }

      .info-sweet-spot {
        @apply border-green-500 bg-green-50;
      }

      .info-under-training {
        @apply border-orange-500 bg-orange-50;
      }

      .info-no-data {
        @apply border-gray-400 bg-gray-50;
      }

      .risk-header {
        @apply flex justify-between items-center mb-4;
      }

      .risk-title {
        @apply text-xl font-bold m-0;
      }

      .acwr-value {
        @apply text-3xl font-bold;
      }

      .risk-description {
        @apply text-text-secondary mb-4;
      }

      .risk-recommendation {
        @apply text-sm font-semibold;
      }

      .risk-scale {
        @apply w-full max-w-md relative;
        height: 80px;
      }

      .scale-bar {
        @apply flex h-8 rounded-lg overflow-hidden;
        @apply border-2 border-gray-300;
      }

      .scale-segment {
        @apply flex items-center justify-center text-white text-xs font-bold;
        @apply transition-all duration-300;
        position: relative;
      }

      .scale-segment.active {
        @apply shadow-lg;
        transform: scaleY(1.1);
        z-index: 10;
      }

      .segment-under {
        @apply bg-orange-500;
      }

      .segment-sweet {
        @apply bg-green-500;
      }

      .segment-elevated {
        @apply bg-yellow-500;
      }

      .segment-danger {
        @apply bg-red-600;
      }

      .segment-label {
        @apply absolute -bottom-6 text-xs font-semibold text-text-primary;
        white-space: nowrap;
      }

      .scale-marker {
        @apply absolute top-0;
        transform: translateX(-50%);
        width: 2px;
        height: 100%;
      }

      .marker-line {
        @apply w-full h-full bg-gray-900;
      }

      .marker-value {
        @apply absolute -top-8 left-1/2 transform -translate-x-1/2;
        @apply bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold;
        white-space: nowrap;
      }

      .marker-value::after {
        content: "";
        @apply absolute top-full left-1/2 transform -translate-x-1/2;
        border: 4px solid transparent;
        border-top-color: theme("colors.gray.900");
      }
    `,
  ],
})
export class TrafficLightRiskComponent {
  // Angular 21: Use input.required() for required inputs instead of @Input() with !
  riskZone = input.required<RiskZone>();
  acwrValue = input.required<number>();

  currentRisk = computed(() => this.riskZone());

  markerPosition = computed(() => {
    const value = this.acwrValue();
    if (value < 0.8) {
      return (value / 0.8) * 20;
    } else if (value < 1.3) {
      return 20 + ((value - 0.8) / 0.5) * 50;
    } else if (value < 1.5) {
      return 70 + ((value - 1.3) / 0.2) * 20;
    } else {
      return 90 + Math.min(((value - 1.5) / 0.5) * 10, 10);
    }
  });
}
