import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";

export interface WeatherData {
  temp: number;
  condition: string;
  suitability: "excellent" | "good" | "fair" | "poor";
  suitable: boolean;
  humidity?: number;
  windSpeed?: number;
  description?: string;
}

@Injectable({
  providedIn: "root",
})
export class WeatherService {
  private apiService = inject(ApiService);

  /**
   * Get weather data for outdoor training suitability
   */
  getWeatherData(location?: string): Observable<WeatherData | null> {
    // Try API first
    return this.apiService
      .get<WeatherData>(
        API_ENDPOINTS.weather?.current || "/api/weather/current",
        location ? { location } : undefined,
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          // Fallback to mock weather
          return this.generateMockWeather();
        }),
        catchError(() => {
          // Fallback to mock weather on error
          return of(this.generateMockWeather());
        }),
      );
  }

  /**
   * Generate mock weather data for development
   */
  private generateMockWeather(): WeatherData {
    const conditions = [
      {
        condition: "Sunny",
        temp: 72,
        suitable: true,
        suitability: "excellent" as const,
      },
      {
        condition: "Partly Cloudy",
        temp: 68,
        suitable: true,
        suitability: "good" as const,
      },
      {
        condition: "Cloudy",
        temp: 65,
        suitable: true,
        suitability: "good" as const,
      },
      {
        condition: "Light Rain",
        temp: 60,
        suitable: false,
        suitability: "fair" as const,
      },
      {
        condition: "Rainy",
        temp: 55,
        suitable: false,
        suitability: "poor" as const,
      },
    ];

    const randomCondition =
      conditions[Math.floor(Math.random() * conditions.length)];

    return {
      temp: randomCondition.temp,
      condition: randomCondition.condition,
      suitability: randomCondition.suitability,
      suitable: randomCondition.suitable,
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 15) + 5,
      description: `Perfect for outdoor training`,
    };
  }

  /**
   * Get weather severity for UI display
   */
  getWeatherSeverity(
    suitability: "excellent" | "good" | "fair" | "poor",
  ): "success" | "info" | "warning" | "danger" {
    switch (suitability) {
      case "excellent":
        return "success";
      case "good":
        return "info";
      case "fair":
        return "warning";
      case "poor":
        return "danger";
      default:
        return "info";
    }
  }
}
