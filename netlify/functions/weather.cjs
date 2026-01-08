// Netlify Function: Weather Data
// Provides current weather information for training planning

const { baseHandler } = require("./utils/base-handler.cjs");
const { createSuccessResponse } = require("./utils/error-handler.cjs");

/**
 * Get weather data from OpenWeatherMap API or Open-Meteo (free fallback)
 */
async function getWeatherData(latitude, longitude, city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  // Try OpenWeatherMap first if API key is configured
  if (apiKey) {
    try {
      const data = await getOpenWeatherData(latitude, longitude, city, apiKey);
      if (data) return data;
    } catch (error) {
      console.warn("OpenWeatherMap failed, falling back to Open-Meteo:", error.message);
    }
  }

  // Fallback to Open-Meteo (FREE, no API key required)
  console.log("Using Open-Meteo (free) for weather data");
  return await getOpenMeteoData(latitude, longitude, city);
}

/**
 * Get weather from OpenWeatherMap API
 */
async function getOpenWeatherData(latitude, longitude, city, apiKey) {
  let apiUrl = "https://api.openweathermap.org/data/2.5/weather?";

  if (latitude && longitude) {
    apiUrl += `lat=${latitude}&lon=${longitude}`;
  } else if (city) {
    apiUrl += `q=${encodeURIComponent(city)}`;
  } else {
    apiUrl += "q=San Francisco,US";
  }

  apiUrl += `&appid=${apiKey}&units=imperial`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    temp: Math.round(data.main.temp),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: data.wind?.speed || 0,
    visibility: data.visibility ? (data.visibility / 1000).toFixed(1) : null,
    suitable: isWeatherSuitable(data),
    suitability: getSuitabilityLevel(data),
    icon: getWeatherIcon(data.weather[0].main),
    location: data.name || city || "Unknown",
  };
}

/**
 * Get weather from Open-Meteo API (FREE, no API key required)
 * https://open-meteo.com/
 */
async function getOpenMeteoData(latitude, longitude, city) {
  try {
    let lat = latitude || 37.7749;
    let lon = longitude || -122.4194;
    let locationName = city || "Training Ground";

    // If city provided but no coordinates, geocode the city
    if (city && !latitude && !longitude) {
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
          {
            headers: { "User-Agent": "FlagFitPro/1.0" },
          }
        );

        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lon = parseFloat(geoData[0].lon);
            locationName = geoData[0].display_name?.split(",")[0] || city;
          }
        }
      } catch (geoError) {
        console.warn("Geocoding failed, using default location:", geoError.message);
      }
    }

    // Call Open-Meteo API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error(`Open-Meteo API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    const weatherCondition = getOpenMeteoCondition(current.weather_code);
    const suitability = calculateOpenMeteoSuitability(
      current.temperature_2m,
      current.wind_speed_10m,
      current.weather_code
    );

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
    };
  } catch (error) {
    console.error("Open-Meteo error:", error);
    // Return default data on error
    return {
      temp: 72,
      condition: "Unknown",
      description: "Weather data temporarily unavailable",
      humidity: 50,
      windSpeed: 5,
      visibility: null,
      suitable: true,
      suitability: "good",
      icon: "🌤️",
      location: city || "Unknown",
    };
  }
}

/**
 * Map Open-Meteo weather codes to readable conditions
 */
function getOpenMeteoCondition(code) {
  if (code === 0) {
    return { condition: "Clear", description: "Perfect weather for training", icon: "☀️" };
  } else if (code <= 3) {
    return { condition: "Partly Cloudy", description: "Good conditions for outdoor activity", icon: "⛅" };
  } else if (code <= 48) {
    return { condition: "Foggy", description: "Reduced visibility, be cautious", icon: "🌫️" };
  } else if (code <= 67) {
    return { condition: "Rainy", description: "Consider indoor training", icon: "🌧️" };
  } else if (code <= 77) {
    return { condition: "Snowy", description: "Indoor training recommended", icon: "❄️" };
  } else if (code <= 99) {
    return { condition: "Stormy", description: "Stay indoors, unsafe for training", icon: "⛈️" };
  }
  return { condition: "Unknown", description: "Weather data unavailable", icon: "🌤️" };
}

/**
 * Calculate training suitability for Open-Meteo data
 */
function calculateOpenMeteoSuitability(temp, windSpeed, weatherCode) {
  if (weatherCode >= 80 || windSpeed > 25) {
    return { suitable: false, level: "poor" };
  }
  if (weatherCode >= 60 || temp < 32 || temp > 95) {
    return { suitable: false, level: "poor" };
  }
  if (weatherCode >= 45 || temp < 40 || temp > 85 || windSpeed > 15) {
    return { suitable: true, level: "fair" };
  }
  if (weatherCode >= 3 || temp < 50 || temp > 78 || windSpeed > 10) {
    return { suitable: true, level: "good" };
  }
  return { suitable: true, level: "excellent" };
}

/**
 * Determine if weather is suitable for outdoor training
 */
function isWeatherSuitable(weatherData) {
  const { temp } = weatherData.main;
  const condition = weatherData.weather[0].main.toLowerCase();
  const windSpeed = weatherData.wind?.speed || 0;

  // Too hot or too cold
  if (temp > 95 || temp < 32) {
    return false;
  }

  // Dangerous conditions
  const dangerousConditions = ["thunderstorm", "extreme", "snow", "sleet"];
  if (dangerousConditions.some((c) => condition.includes(c))) {
    return false;
  }

  // Too windy
  if (windSpeed > 25) {
    return false;
  }

  return true;
}

/**
 * Get suitability level for training
 */
function getSuitabilityLevel(weatherData) {
  const { temp } = weatherData.main;
  const condition = weatherData.weather[0].main.toLowerCase();
  const windSpeed = weatherData.wind?.speed || 0;

  if (!isWeatherSuitable(weatherData)) {
    return "poor";
  }

  // Ideal conditions
  if (
    temp >= 60 &&
    temp <= 80 &&
    (condition === "clear" || condition === "clouds") &&
    windSpeed < 10
  ) {
    return "excellent";
  }

  // Good conditions
  if (temp >= 50 && temp <= 85 && windSpeed < 15) {
    return "good";
  }

  return "fair";
}

/**
 * Get weather icon based on condition
 */
function getWeatherIcon(condition) {
  const icons = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
  };
  return icons[condition] || "🌤️";
}

/**
 * Main handler function
 */
async function handleRequest(event, _context, { userId: _userId }) {
  try {
    const query = event.queryStringParameters || {};

    // Get location from query params or use defaults
    const latitude = query.lat ? parseFloat(query.lat) : null;
    const longitude = query.lon ? parseFloat(query.lon) : null;
    const city = query.city || query.location || null;

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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in weather handler:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "Weather",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: false, // Weather can be public, but can also use auth for user location
    handler: handleRequest,
  });
};
