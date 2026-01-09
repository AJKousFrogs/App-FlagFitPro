/**
 * Weather Widget Component
 *
 * Displays current weather conditions for training/game locations
 * with safety recommendations and heat index warnings.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import {
  WeatherService,
  WeatherData,
} from "../../../core/services/weather.service";
import { LoggerService } from "../../../core/services/logger.service";
import { CardComponent } from "../card/card.component";
import { isHeatRisk } from "../../../core/constants/wellness.constants";

@Component({
  selector: "app-weather-widget",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, TagModule, TooltipModule, CardComponent],
  template: `
    @if (weatherData()) {
      <app-card
        title="Weather Conditions"
        headerIcon="pi-cloud"
        styleClass="weather-widget"
      >
        <div class="weather-content">
          <!-- Current Conditions -->
          <div class="weather-main">
            <div class="temperature-section">
              <span class="temp-value">{{ weatherData()!.temp }}°</span>
              <span class="temp-unit">C</span>
            </div>
            <div class="condition-section">
              <span class="condition-text">{{ weatherData()!.condition }}</span>
              @if (weatherData()!.humidity) {
                <span class="humidity-text"
                  >Humidity: {{ weatherData()!.humidity }}%</span
                >
              }
            </div>
          </div>

          <!-- Suitability Badge -->
          <div class="suitability-section">
            <p-tag
              [value]="getSuitabilityLabel()"
              [severity]="getSuitabilitySeverity()"
              [pTooltip]="getSuitabilityTooltip()"
            ></p-tag>
          </div>

          <!-- Recommendations -->
          @if (weatherData()!.description) {
            <div class="recommendations">
              <p class="recommendation-text">
                {{ weatherData()!.description }}
              </p>
            </div>
          }

          <!-- Heat Index Warning -->
          @if (isHeatRisk()) {
            <div class="heat-warning">
              <i class="pi pi-exclamation-triangle"></i>
              <span>High heat index - ensure adequate hydration</span>
            </div>
          }
        </div>
      </app-card>
    } @else if (isLoading()) {
      <app-card title="Weather Conditions" [loading]="true">
        <div class="loading-text">Loading weather data...</div>
      </app-card>
    }
  `,
  styles: [
    `
      .weather-widget {
        min-height: 200px;
      }

      .weather-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .weather-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4);
      }

      .temperature-section {
        display: flex;
        align-items: baseline;
        gap: var(--space-1);
      }

      .temp-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .temp-unit {
        font-size: 1.25rem;
        color: var(--text-secondary);
      }

      .condition-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-1);
      }

      .condition-text {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .humidity-text {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .suitability-section {
        display: flex;
        justify-content: center;
      }

      .recommendations {
        padding: var(--space-3);
        background: var(--surface-ground);
        border-radius: var(--border-radius-md);
      }

      .recommendation-text {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .heat-warning {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--color-warning-50);
        border: 1px solid var(--color-warning-200);
        border-radius: var(--border-radius-md);
        color: var(--color-warning-700);
        font-size: 0.875rem;
        font-weight: 500;
      }

      .heat-warning i {
        font-size: 1.25rem;
      }

      .loading-text {
        padding: var(--space-4);
        text-align: center;
        color: var(--text-secondary);
      }

      @media (max-width: 768px) {
        .weather-main {
          flex-direction: column;
          align-items: flex-start;
        }

        .condition-section {
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class WeatherWidgetComponent implements OnInit {
  private weatherService = inject(WeatherService);
  private logger = inject(LoggerService);

  weatherData = signal<WeatherData | null>(null);
  isLoading = signal<boolean>(true);
  location = signal<string>("Training Ground");

  isHeatRisk = computed(() => {
    const data = this.weatherData();
    if (!data) return false;
    // Severe heat above 30C, or use configurable thresholds
    return data.temp > 30 || isHeatRisk(data.temp, data.humidity ?? 0);
  });

  ngOnInit(): void {
    this.loadWeather();
  }

  async loadWeather(): Promise<void> {
    this.isLoading.set(true);
    try {
      const weather = await firstValueFrom(
        this.weatherService.getWeatherData(this.location()),
      );
      this.weatherData.set(weather || null);
    } catch (error) {
      this.logger.error("Failed to load weather data:", error);
      this.weatherData.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  getSuitabilityLabel(): string {
    const suitability = this.weatherData()?.suitability || "fair";
    const labels: Record<string, string> = {
      excellent: "Excellent Conditions",
      good: "Good Conditions",
      fair: "Fair Conditions",
      poor: "Poor Conditions",
    };
    return labels[suitability] || "Unknown";
  }

  getSuitabilitySeverity():
    | "success"
    | "info"
    | "warn"
    | "danger"
    | "secondary" {
    return this.weatherService.getWeatherSeverity(
      this.weatherData()?.suitability || "fair",
    );
  }

  getSuitabilityTooltip(): string {
    const suitability = this.weatherData()?.suitability || "fair";
    const tooltips: Record<string, string> = {
      excellent:
        "Perfect conditions for outdoor training. Stay hydrated and enjoy!",
      good: "Good conditions for training. Normal hydration recommended.",
      fair: "Conditions are acceptable but monitor closely. Increase hydration.",
      poor: "Poor conditions - consider indoor training or rescheduling.",
    };
    return tooltips[suitability] || "Weather conditions unknown";
  }
}
