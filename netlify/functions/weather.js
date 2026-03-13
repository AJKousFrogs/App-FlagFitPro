import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";

// Netlify Function: Weather Data
// Provides current weather information for training planning
const DEFAULT_LATITUDE = 37.7749;
const DEFAULT_LONGITUDE = -122.4194;
const DEFAULT_LOCATION_NAME = "Training Ground";
const REQUEST_TIMEOUT_MS = 6000;
const GEO_USER_AGENT = "FlagFitPro/1.0 (weather-geocoding)";

function createSafetyFallback(location, description) {
  return {
    temp: null,
    condition: "Unknown",
    description:
      description ||
      "Weather data temporarily unavailable. Check local weather before outdoor training.",
    humidity: null,
    windSpeed: null,
    visibility: null,
    suitable: false,
    suitability: "poor",
    icon: "⚠️",
    location: location || "Unknown",
    safetyWarning: true,
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get weather data from Open-Meteo API (free, no API key required)
 */
async function getWeatherData(latitude, longitude, city) {
  console.log("Using Open-Meteo for weather data");
  return await getOpenMeteoData(latitude, longitude, city);
}

/**
 * Get weather from Open-Meteo API (FREE, no API key required)
 * https://open-meteo.com/
 */
async function getOpenMeteoData(latitude, longitude, city) {
  try {
    let lat = latitude || DEFAULT_LATITUDE;
    let lon = longitude || DEFAULT_LONGITUDE;
    let locationName = city || DEFAULT_LOCATION_NAME;

    // If city provided but no coordinates, geocode the city
    if (city && !latitude && !longitude) {
      try {
        const geoResponse = await fetchWithTimeout(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
          {
            headers: { "User-Agent": GEO_USER_AGENT },
          },
        );

        if (!geoResponse.ok) {
          throw new Error(`Geocoding service returned ${geoResponse.status}`);
        }

        const geoData = await geoResponse.json();
        if (!Array.isArray(geoData) || geoData.length === 0) {
          return createSafetyFallback(
            city,
            "Location could not be resolved. Check spelling or use coordinates for weather lookup.",
          );
        }

        lat = parseFloat(geoData[0].lat);
        lon = parseFloat(geoData[0].lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          return createSafetyFallback(
            city,
            "Location coordinates were invalid. Please retry with a specific location.",
          );
        }
        locationName = geoData[0].display_name?.split(",")[0] || city;
      } catch (geoError) {
        console.warn("Geocoding failed:", geoError.message);
        return createSafetyFallback(
          city,
          "Location lookup failed. Check local weather before outdoor training.",
        );
      }
    }

    // Call Open-Meteo API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,cloud_cover&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;

    const weatherResponse = await fetchWithTimeout(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error(`Open-Meteo API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    const { current } = weatherData;
    if (!current) {
      throw new Error("Open-Meteo response missing current weather data");
    }

    const weatherCondition = getOpenMeteoCondition(current.weather_code);
    const suitability = calculateOpenMeteoSuitability({
      temp: current.temperature_2m,
      apparentTemp: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
      precipitation: current.precipitation || 0,
    });

    return {
      temp: Math.round(current.temperature_2m),
      condition: weatherCondition.condition,
      description: weatherCondition.description,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      visibility: null,
      suitable: suitability.suitable,
      suitability: suitability.level,
      icon: weatherCondition.icon,
      location: locationName,
      safetyWarning: suitability.level === "poor" && !suitability.suitable,
    };
  } catch (error) {
    console.error("Open-Meteo error:", error);
    // Return conservative safety-first data on error (never optimistic).
    return createSafetyFallback(city);
  }
}

function parseCoordinateParam(value, label, min, max) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const raw = String(value).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(raw)) {
    throw new Error(`${label} must be a valid number`);
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${label} must be between ${min} and ${max}`);
  }

  return parsed;
}

function parseCityParam(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const city = String(value).trim();
  if (city.length === 0) {
    return null;
  }
  if (city.length > 120) {
    throw new Error("city must be 120 characters or less");
  }
  return city;
}

/**
 * Map Open-Meteo weather codes to readable conditions
 */
function getOpenMeteoCondition(code) {
  if (code === 0) {
    return {
      condition: "Clear",
      description: "Perfect weather for training",
      icon: "☀️",
    };
  }

  if (code >= 1 && code <= 3) {
    return {
      condition: "Partly Cloudy",
      description: "Good conditions for outdoor activity",
      icon: "⛅",
    };
  }

  if (code === 45 || code === 48) {
    return {
      condition: "Foggy",
      description: "Reduced visibility, be cautious",
      icon: "🌫️",
    };
  }

  if (code === 51 || code === 53 || code === 55) {
    return {
      condition: "Drizzle",
      description: "Light precipitation; consider caution for field traction",
      icon: "🌦️",
    };
  }

  if (code === 61) {
    return {
      condition: "Light Rain",
      description: "Wet conditions; indoor alternative may be safer",
      icon: "🌧️",
    };
  }

  if (code === 63 || code === 80 || code === 81) {
    return {
      condition: "Rain",
      description: "Outdoor training quality reduced",
      icon: "🌧️",
    };
  }

  if (code === 65 || code === 82) {
    return {
      condition: "Heavy Rain",
      description: "Unsafe wet-field conditions. Indoor training recommended",
      icon: "🌧️",
    };
  }

  if (code === 66 || code === 67) {
    return {
      condition: "Freezing Rain",
      description: "Dangerous surface conditions. Indoor training only",
      icon: "🌨️",
    };
  }

  if (code === 71 || code === 73 || code === 75 || code === 77) {
    return {
      condition: "Snow",
      description: "Indoor training recommended",
      icon: "❄️",
    };
  }

  if (code === 85 || code === 86) {
    return {
      condition: "Snow Showers",
      description: "Slippery conditions likely. Indoor training recommended",
      icon: "❄️",
    };
  }

  if (code === 95) {
    return {
      condition: "Thunderstorm",
      description: "Unsafe for outdoor training. Stay indoors",
      icon: "⛈️",
    };
  }

  if (code === 96 || code === 99) {
    return {
      condition: "Thunderstorm with Hail",
      description: "Severe weather danger. Do not train outdoors",
      icon: "⛈️",
    };
  }

  return {
    condition: "Unknown",
    description: "Weather data unavailable",
    icon: "🌤️",
  };
}

/**
 * Calculate training suitability for Open-Meteo data
 */
function calculateOpenMeteoSuitability({
  temp,
  apparentTemp,
  windSpeed,
  weatherCode,
  precipitation,
}) {
  const effectiveTemp = Number.isFinite(apparentTemp) ? apparentTemp : temp;

  // Dangerous conditions (hard stop)
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return { suitable: false, level: "poor" };
  }
  if (weatherCode === 65 || weatherCode === 82 || weatherCode === 66 || weatherCode === 67) {
    return { suitable: false, level: "poor" };
  }
  if ((precipitation || 0) >= 0.12) {
    return { suitable: false, level: "poor" };
  }
  if (effectiveTemp < 32 || effectiveTemp > 95) {
    return { suitable: false, level: "poor" };
  }
  if (windSpeed >= 30) {
    return { suitable: false, level: "poor" };
  }

  // Cautionary but potentially trainable conditions
  if (weatherCode === 63 || weatherCode === 80 || weatherCode === 81) {
    return { suitable: true, level: "fair" };
  }
  if ((precipitation || 0) >= 0.03) {
    return { suitable: true, level: "fair" };
  }
  if (weatherCode === 45 || weatherCode === 48 || weatherCode === 51 || weatherCode === 53 || weatherCode === 55) {
    return { suitable: true, level: "fair" };
  }
  if (effectiveTemp < 40 || effectiveTemp > 85 || windSpeed >= 20) {
    return { suitable: true, level: "fair" };
  }

  // Good conditions, minor constraints
  if (weatherCode >= 1 && weatherCode <= 3) {
    return { suitable: true, level: "good" };
  }
  if (effectiveTemp < 50 || effectiveTemp > 78 || windSpeed >= 10) {
    return { suitable: true, level: "good" };
  }

  return { suitable: true, level: "excellent" };
}


/**
 * Main handler function
 */
async function handleRequest(event, _context, { userId: _userId }) {
  try {
    const query = event.queryStringParameters || {};

    const latitude = parseCoordinateParam(query.lat, "lat", -90, 90);
    const longitude = parseCoordinateParam(query.lon, "lon", -180, 180);
    const city = parseCityParam(query.city || query.location);

    const hasLat = latitude !== null;
    const hasLon = longitude !== null;
    if (hasLat !== hasLon) {
      return handleValidationError(
        "lat and lon must both be provided when using coordinates",
      );
    }

    // Get weather data
    const weatherData = await getWeatherData(latitude, longitude, city);

    // Return data in format expected by Angular WeatherService
    return createSuccessResponse({
      temp: weatherData.temp,
      condition: weatherData.condition,
      suitability: weatherData.suitability,
      suitable: weatherData.suitable,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      description: weatherData.description,
      location: weatherData.location,
      icon: weatherData.icon,
      safetyWarning: weatherData.safetyWarning || false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (
      /must be a valid number|must be between|120 characters or less/i.test(
        error.message || "",
      )
    ) {
      return handleValidationError(error.message);
    }
    console.error("Error in weather handler:", error);
    throw error;
  }
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "Weather",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: false, // Weather can be public, but can also use auth for user location
    handler: handleRequest,
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
