import { baseHandler } from "./utils/base-handler.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import { supabaseAdmin } from "./supabase-client.js";
import {
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.weather" });

// Netlify Function: Weather Data
// Provides current weather information for training planning.
// Location resolution: query coords/city → caller's team home_city → explicit
// "unavailable" response. NEVER a default location — fake weather driving the
// heat/rain/storm training guards is worse than no weather (guards stay off).
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
    hourly: [],
  };
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) {
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
  logger.info("weather_provider_open_meteo");
  return await getOpenMeteoData(latitude, longitude, city);
}

/**
 * Flatten Open-Meteo's parallel hourly arrays (`time[]`, `temperature_2m[]`, …)
 * into per-hour points `{ time, tempC, humidityPct, apparentC, weatherCode,
 * windKmh, precipMm }`. `time` is the venue-local ISO string ("YYYY-MM-DDTHH:MM").
 * Returns [] for any missing/mismatched input — the time-shift is optional and
 * must never break the weather payload.
 */
function parseHourly(hourly) {
  if (!hourly || !Array.isArray(hourly.time)) {
    return [];
  }
  const n = hourly.time.length;
  const at = (arr, i) =>
    Array.isArray(arr) && typeof arr[i] === "number" ? arr[i] : null;
  const points = [];
  for (let i = 0; i < n; i++) {
    if (typeof hourly.time[i] !== "string") {
      continue;
    }
    points.push({
      time: hourly.time[i],
      tempC: at(hourly.temperature_2m, i),
      humidityPct: at(hourly.relative_humidity_2m, i),
      apparentC: at(hourly.apparent_temperature, i),
      weatherCode: at(hourly.weather_code, i),
      windKmh: at(hourly.wind_speed_10m, i),
      precipMm: at(hourly.precipitation, i),
    });
  }
  return points;
}

/**
 * Get weather from Open-Meteo API (FREE, no API key required)
 * https://open-meteo.com/
 */
async function getOpenMeteoData(latitude, longitude, city) {
  try {
    // Callers guarantee coords or a city — there is no default location.
    let lat = latitude;
    let lon = longitude;
    let locationName = city;

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
        logger.warn("weather_geocoding_failed", { message: geoError.message });
        return createSafetyFallback(
          city,
          "Location lookup failed. Check local weather before outdoor training.",
        );
      }
    }

    // Call Open-Meteo API
    // Metric units — this is a metric club (Ljubljana; users.preferred_units=metric)
    // and all training thresholds are °C / km/h / mm. See WEATHER_LOGIC.md.
    // Phase 5b — also pull the HOURLY forecast (today + tomorrow, venue-local
    // via timezone=auto) so the engine can suggest shifting a hot session to a
    // cooler hour ("train at 20:00 when it drops to ~27° WBGT").
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,cloud_cover&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation&forecast_days=2&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto`;

    const weatherResponse = await fetchWithTimeout(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error(`Open-Meteo API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    const { current } = weatherData;
    if (!current) {
      throw new Error("Open-Meteo response missing current weather data");
    }

    // Flatten Open-Meteo's parallel hourly arrays into per-hour points the
    // engine's time-shift resolver consumes. Venue-local time strings (timezone
    // =auto) → no TZ conversion needed downstream. Missing/short arrays → [].
    const hourly = parseHourly(weatherData.hourly);

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
      // raw metric fields the prescription weather guard consumes (°C, mm, km/h)
      apparentC: current.apparent_temperature,
      weatherCode: current.weather_code,
      precipMm: current.precipitation || 0,
      windKmh: current.wind_speed_10m,
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
      hourly,
    };
  } catch (error) {
    logger.error("weather_open_meteo_error", error);
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
  if (
    weatherCode === 65 ||
    weatherCode === 82 ||
    weatherCode === 66 ||
    weatherCode === 67
  ) {
    return { suitable: false, level: "poor" };
  }
  // Thresholds are METRIC (°C, km/h, mm) — converted from the prior °F/mph/inch.
  if ((precipitation || 0) >= 3) {
    return { suitable: false, level: "poor" };
  }
  if (effectiveTemp < 0 || effectiveTemp > 35) {
    return { suitable: false, level: "poor" };
  }
  if (windSpeed >= 48) {
    return { suitable: false, level: "poor" };
  }

  // Cautionary but potentially trainable conditions
  if (weatherCode === 63 || weatherCode === 80 || weatherCode === 81) {
    return { suitable: true, level: "fair" };
  }
  if ((precipitation || 0) >= 0.8) {
    return { suitable: true, level: "fair" };
  }
  if (
    weatherCode === 45 ||
    weatherCode === 48 ||
    weatherCode === 51 ||
    weatherCode === 53 ||
    weatherCode === 55
  ) {
    return { suitable: true, level: "fair" };
  }
  if (effectiveTemp < 4 || effectiveTemp > 29 || windSpeed >= 32) {
    return { suitable: true, level: "fair" };
  }

  // Good conditions, minor constraints
  if (weatherCode >= 1 && weatherCode <= 3) {
    return { suitable: true, level: "good" };
  }
  if (effectiveTemp < 10 || effectiveTemp > 26 || windSpeed >= 16) {
    return { suitable: true, level: "good" };
  }

  return { suitable: true, level: "excellent" };
}

/**
 * Resolve the caller's location from their team's home_city — the most recent
 * active membership whose team has one set.
 */
async function resolveTeamHomeCity(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("team_members")
      .select("teams ( home_city )")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false });

    if (error) {
      logger.warn("weather_team_city_lookup_failed", {
        message: error.message,
      });
      return null;
    }
    for (const row of data ?? []) {
      const homeCity = row?.teams?.home_city;
      if (typeof homeCity === "string" && homeCity.trim().length > 0) {
        return homeCity.trim();
      }
    }
  } catch (lookupError) {
    logger.warn("weather_team_city_lookup_failed", {
      message: lookupError.message,
    });
  }
  return null;
}

/**
 * Main handler function
 */
async function handleRequest(event, _context, { userId }) {
  try {
    const query = event.queryStringParameters || {};

    const latitude = parseCoordinateParam(query.lat, "lat", -90, 90);
    const longitude = parseCoordinateParam(query.lon, "lon", -180, 180);
    let city = parseCityParam(query.city || query.location);

    const hasLat = latitude !== null;
    const hasLon = longitude !== null;
    if (hasLat !== hasLon) {
      return handleValidationError(
        "lat and lon must both be provided when using coordinates",
      );
    }

    // No explicit location: fall back to the caller's team home_city.
    // Auth is optional on this route, so resolve the user opportunistically.
    if (!hasLat && !city) {
      let resolvedUserId = userId;
      if (!resolvedUserId) {
        try {
          const auth = await authenticateRequest(event);
          if (auth.success) {
            resolvedUserId = auth.user.id;
          }
        } catch {
          // anonymous caller — fine, weather just stays unavailable
        }
      }
      if (resolvedUserId) {
        city = await resolveTeamHomeCity(resolvedUserId);
      }
    }

    // Still no location → explicit unavailable. Never a fabricated default —
    // the client keeps its weather guard off and shows no weather.
    if (!hasLat && !city) {
      return createSuccessResponse({
        available: false,
        reason: "no_location",
        description:
          "No location on file. Set your team's home city (or pass lat/lon) to enable weather-aware training.",
        timestamp: new Date().toISOString(),
      });
    }

    // Get weather data
    const weatherData = await getWeatherData(latitude, longitude, city);

    // Return data in format expected by Angular WeatherService
    return createSuccessResponse({
      available: weatherData.temp !== null,
      temp: weatherData.temp,
      condition: weatherData.condition,
      suitability: weatherData.suitability,
      suitable: weatherData.suitable,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      // Raw metric fields the prescription weather guard consumes — without
      // these, the storm-stop and wet-substitute branches never fire (only
      // heat/cold/wind survive via fallbacks in periodization.service).
      apparentC: weatherData.apparentC,
      weatherCode: weatherData.weatherCode,
      precipMm: weatherData.precipMm,
      windKmh: weatherData.windKmh,
      description: weatherData.description,
      location: weatherData.location,
      icon: weatherData.icon,
      safetyWarning: weatherData.safetyWarning || false,
      // Phase 5b — hourly forecast for the cooler-hour time-shift suggestion.
      hourly: weatherData.hourly ?? [],
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
    logger.error("weather_handler_error", error);
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
export { handler, resolveTeamHomeCity, getWeatherData };
