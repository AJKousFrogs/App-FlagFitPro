import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Tooltip } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { LoggerService } from "../../../core/services/logger.service";
import {
  WeatherData,
  WeatherService,
} from "../../../core/services/weather.service";

@Component({
  selector: "app-header-weather-widget",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tooltip],
  templateUrl: "./header-weather-widget.component.html",
})
export class HeaderWeatherWidgetComponent implements OnInit {
  private readonly weatherService = inject(WeatherService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly weatherData = signal<WeatherData | null>(null);

  readonly weatherIcon = computed(() => {
    const data = this.weatherData();
    if (!data) return "pi-cloud";

    const condition = data.condition?.toLowerCase() || "";
    if (condition.includes("sun") || condition.includes("clear"))
      return "pi-sun";
    if (condition.includes("cloud")) return "pi-cloud";
    if (condition.includes("rain")) return "pi-cloud";
    if (condition.includes("snow")) return "pi-snowflake";
    if (condition.includes("storm") || condition.includes("thunder"))
      return "pi-bolt";
    return "pi-cloud";
  });

  readonly weatherTooltip = computed(() => {
    const data = this.weatherData();
    if (!data) return "Weather data unavailable";

    let tooltip = `${data.condition} - ${data.temp}°F`;
    if (data.humidity) tooltip += ` | Humidity: ${data.humidity}%`;
    if (data.description) tooltip += `\n${data.description}`;
    return tooltip;
  });

  readonly weatherSeverityClass = computed(() => {
    const data = this.weatherData();
    if (!data) return "";

    switch (data.suitability) {
      case "excellent":
        return "weather-excellent";
      case "good":
        return "weather-good";
      case "fair":
        return "weather-fair";
      case "poor":
        return "weather-poor";
      default:
        return "";
    }
  });

  ngOnInit(): void {
    this.loadWeatherData();
  }

  private loadWeatherData(): void {
    // SSR safety
    if (typeof navigator === "undefined") {
      this.fetchWeatherByLocation();
      return;
    }

    // Try to get user's geolocation for accurate weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          this.fetchWeatherWithCoords(coords);
        },
        () => {
          this.fetchWeatherByLocation();
        },
        { timeout: 5000, enableHighAccuracy: false },
      );
    } else {
      this.fetchWeatherByLocation();
    }
  }

  private fetchWeatherWithCoords(coords: { lat: number; lon: number }): void {
    this.weatherService
      .getWeatherData(undefined, coords)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.weatherData.set(data ?? null);
        },
        error: (err) => {
          this.logger.error("Failed to load weather data with coords:", err);
          this.fetchWeatherByLocation();
        },
      });
  }

  private fetchWeatherByLocation(): void {
    this.weatherService
      .getWeatherData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.weatherData.set(data ?? null);
        },
        error: (err) => {
          this.logger.error("Failed to load weather data:", err);
          this.weatherData.set(null);
        },
      });
  }
}
