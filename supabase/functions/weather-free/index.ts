// Free Weather Service using Open-Meteo (No API key required!)
// https://open-meteo.com/
// 100% free, unlimited calls for non-commercial use

// @ts-ignore
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  buildRequestContext,
  createLogger,
} from "../_shared/structured-logger.ts";

interface WeatherRequest {
  latitude?: number;
  longitude?: number;
  city?: string;
}

const logger = createLogger("supabase.weather-free");

Deno.serve(async (req) => {
  const requestLogger = logger.child(buildRequestContext(req));

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, city } = (await req.json()) as WeatherRequest;

    // Default to San Francisco if no location provided
    let lat = latitude || 37.7749;
    let lon = longitude || -122.4194;

    // If city provided, use Nominatim to get coordinates (also free!)
    if (city && !latitude && !longitude) {
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "FlagFitPro/1.0",
          },
        },
      );

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lon = parseFloat(geoData[0].lon);
        }
      }
    }

    // Call Open-Meteo API (FREE, no API key!)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    // Map weather codes to conditions
    // https://open-meteo.com/en/docs
    const weatherCondition = getWeatherCondition(current.weather_code);
    const suitability = calculateSuitability(
      current.temperature_2m,
      current.wind_speed_10m,
      current.weather_code,
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          temp: Math.round(current.temperature_2m),
          condition: weatherCondition.condition,
          description: weatherCondition.description,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          suitable: suitability.suitable,
          suitability: suitability.level,
          icon: weatherCondition.icon,
          location: city || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    requestLogger.error("weather_request_failed", error);

    // Return error state instead of mock data
    // Mock weather data could lead athletes to train in unsafe conditions
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error:
          "Weather data temporarily unavailable. Check local weather before outdoor training.",
        // Include a safety flag so UI can show appropriate warnings
        safetyWarning: true,
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

/**
 * Map Open-Meteo weather codes to readable conditions
 * https://open-meteo.com/en/docs
 */
function getWeatherCondition(code: number): {
  condition: string;
  description: string;
  icon: string;
} {
  if (code === 0) {
    return {
      condition: "Clear",
      description: "Perfect weather for training",
      icon: "pi pi-sun",
    };
  } else if (code <= 3) {
    return {
      condition: "Partly Cloudy",
      description: "Good conditions for outdoor activity",
      icon: "pi pi-cloud",
    };
  } else if (code <= 48) {
    return {
      condition: "Foggy",
      description: "Reduced visibility, be cautious",
      icon: "pi pi-cloud",
    };
  } else if (code <= 67) {
    return {
      condition: "Rainy",
      description: "Consider indoor training",
      icon: "pi pi-cloud",
    };
  } else if (code <= 77) {
    return {
      condition: "Snowy",
      description: "Indoor training recommended",
      icon: "pi pi-cloud",
    };
  } else if (code <= 99) {
    return {
      condition: "Stormy",
      description: "Stay indoors, unsafe for training",
      icon: "pi pi-bolt",
    };
  }

  return {
    condition: "Unknown",
    description: "Weather data unavailable",
    icon: "pi pi-question-circle",
  };
}

/**
 * Calculate training suitability based on weather
 */
function calculateSuitability(
  temp: number,
  windSpeed: number,
  weatherCode: number,
): {
  suitable: boolean;
  level: "excellent" | "good" | "fair" | "poor";
} {
  // Unsafe conditions
  if (weatherCode >= 80 || windSpeed > 25) {
    return { suitable: false, level: "poor" };
  }

  // Poor conditions
  if (weatherCode >= 60 || temp < 32 || temp > 95) {
    return { suitable: false, level: "poor" };
  }

  // Fair conditions
  if (weatherCode >= 45 || temp < 40 || temp > 85 || windSpeed > 15) {
    return { suitable: true, level: "fair" };
  }

  // Good conditions
  if (weatherCode >= 3 || temp < 50 || temp > 78 || windSpeed > 10) {
    return { suitable: true, level: "good" };
  }

  // Excellent conditions
  return { suitable: true, level: "excellent" };
}
