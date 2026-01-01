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
          return null;
        }),
        catchError(() => {
          return of(null);
        }),
      );
  }

  /**
   * Get weather severity for UI display
   */
  getWeatherSeverity(
    suitability: "excellent" | "good" | "fair" | "poor",
  ): "success" | "info" | "warn" | "danger" {
    switch (suitability) {
      case "excellent":
        return "success";
      case "good":
        return "info";
      case "fair":
        return "warn";
      case "poor":
        return "danger";
      default:
        return "info";
    }
  }
}
