// Netlify Function: Weather Data
// Provides current weather information for training planning

const { baseHandler } = require("./utils/base-handler.cjs");
const { createSuccessResponse } = require("./utils/error-handler.cjs");

/**
 * Get weather data from OpenWeatherMap API
 * Falls back to mock data if API key not configured
 */
async function getWeatherData(latitude, longitude, city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  // If no API key, return mock data for development
  if (!apiKey) {
    console.warn("OPENWEATHER_API_KEY not set, returning mock weather data");
    return getMockWeatherData(city);
  }

  try {
    // Build API URL
    let apiUrl = "https://api.openweathermap.org/data/2.5/weather?";

    if (latitude && longitude) {
      apiUrl += `lat=${latitude}&lon=${longitude}`;
    } else if (city) {
      apiUrl += `q=${encodeURIComponent(city)}`;
    } else {
      // Default to a common location if nothing provided
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
  } catch (error) {
    console.error("Error fetching weather:", error);
    // Return mock data on error
    return getMockWeatherData(city);
  }
}

/**
 * Determine if weather is suitable for outdoor training
 */
function isWeatherSuitable(weatherData) {
  const temp = weatherData.main.temp;
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
  const temp = weatherData.main.temp;
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
 * Get mock weather data for development
 */
function getMockWeatherData(city) {
  const mockConditions = [
    { condition: "Clear", temp: 72, suitable: true, suitability: "excellent" },
    { condition: "Clouds", temp: 68, suitable: true, suitability: "good" },
    { condition: "Rain", temp: 65, suitable: false, suitability: "poor" },
    { condition: "Clear", temp: 75, suitable: true, suitability: "excellent" },
  ];

  const random =
    mockConditions[Math.floor(Math.random() * mockConditions.length)];

  return {
    temp: random.temp,
    condition: random.condition,
    description: `${random.condition.toLowerCase()} skies`,
    humidity: 60,
    windSpeed: 8,
    visibility: "10.0",
    suitable: random.suitable,
    suitability: random.suitability,
    icon: getWeatherIcon(random.condition),
    location: city || "Your Location",
    mock: true, // Flag to indicate this is mock data
  };
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
