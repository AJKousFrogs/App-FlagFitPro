import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { API_ENDPOINTS, ApiService } from "./api.service";

export interface WeatherData {
  temp: number;
  condition: string;
  suitability: "excellent" | "good" | "fair" | "poor";
  suitable: boolean;
  humidity?: number;
  windSpeed?: number;
  description?: string;
  location?: string;
}

@Injectable({
  providedIn: "root",
})
export class WeatherService {
  private apiService = inject(ApiService);

  /**
   * Get weather data for outdoor training suitability
   * @param location - City name or location string
   * @param coords - Optional coordinates { lat, lon }
   */
  getWeatherData(
    location?: string,
    coords?: { lat: number; lon: number },
  ): Observable<WeatherData | null> {
    // Build query params
    const params: Record<string, string> = {};
    if (coords) {
      params["lat"] = coords.lat.toString();
      params["lon"] = coords.lon.toString();
    } else if (location) {
      params["location"] = location;
    }

    // Try API
    return this.apiService
      .get<WeatherData>(
        API_ENDPOINTS.weather?.current || "/api/weather/current",
        Object.keys(params).length > 0 ? params : undefined,
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            // Normalize the response data to match WeatherData interface
            const data = response.data as unknown as Record<string, unknown>;
            return this.normalizeWeatherData(data);
          }
          return null;
        }),
        catchError(() => {
          return of(null);
        }),
      );
  }

  /**
   * Normalize weather data from different API formats
   */
  private normalizeWeatherData(data: Record<string, unknown>): WeatherData {
    // Handle both Netlify function format and server.js format
    return {
      temp: (data["temp"] as number) ?? (data["temperature"] as number) ?? 0,
      condition:
        (data["condition"] as string) ??
        (data["conditions"] as string) ??
        "Unknown",
      suitability: this.normalizeSuitability(data["suitability"] as string),
      suitable: (data["suitable"] as boolean) ?? true,
      humidity: (data["humidity"] as number) ?? undefined,
      windSpeed:
        (data["windSpeed"] as number) ??
        (data["wind_speed"] as number) ??
        undefined,
      description: (data["description"] as string) ?? undefined,
      location: (data["location"] as string) ?? undefined,
    };
  }

  /**
   * Normalize suitability string to valid enum value
   */
  private normalizeSuitability(
    suitability: string | undefined,
  ): "excellent" | "good" | "fair" | "poor" {
    const valid = ["excellent", "good", "fair", "poor"];
    if (suitability && valid.includes(suitability)) {
      return suitability as "excellent" | "good" | "fair" | "poor";
    }
    return "fair"; // Default
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
