class WeatherService {
  constructor() {
    this.baseUrl = '/api/weather';
  }

  // Get current weather and forecast
  async getWeatherData(location, options = {}) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          includeForecast: options.includeForecast || true,
          includeAlerts: options.includeAlerts || true,
          includePerformanceImpact: options.includePerformanceImpact || true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  // Get weather forecast for specific dates
  async getForecast(location, startDate, endDate) {
    try {
      const response = await fetch(`${this.baseUrl}/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          startDate,
          endDate
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  // Get weather alerts for location
  async getWeatherAlerts(location) {
    try {
      const response = await fetch(`${this.baseUrl}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      throw error;
    }
  }

  // Calculate performance impact based on weather conditions
  async calculatePerformanceImpact(weatherData, userProfile) {
    try {
      const response = await fetch(`${this.baseUrl}/performance-impact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weather: weatherData,
          userProfile,
          position: userProfile.position,
          fitnessLevel: userProfile.fitnessLevel
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error calculating performance impact:', error);
      throw error;
    }
  }

  // Get weather history for analysis
  async getWeatherHistory(location, startDate, endDate) {
    try {
      const response = await fetch(`${this.baseUrl}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          startDate,
          endDate
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather history:', error);
      throw error;
    }
  }

  // Get weather-based training recommendations
  async getWeatherRecommendations(weatherData, userProfile, trainingType) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weather: weatherData,
          userProfile,
          trainingType,
          position: userProfile.position
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather recommendations:', error);
      throw error;
    }
  }

  // Report weather-related incident
  async reportWeatherIncident(incident) {
    try {
      const response = await fetch(`${this.baseUrl}/incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incident)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error reporting weather incident:', error);
      throw error;
    }
  }

  // Get weather safety guidelines
  async getWeatherSafetyGuidelines(weatherConditions) {
    try {
      const response = await fetch(`${this.baseUrl}/safety-guidelines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conditions: weatherConditions
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching safety guidelines:', error);
      throw error;
    }
  }

  // Get weather-based game strategy adjustments
  async getGameStrategyAdjustments(weatherData, opponent, gameType) {
    try {
      const response = await fetch(`${this.baseUrl}/game-strategy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weather: weatherData,
          opponent,
          gameType
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching game strategy adjustments:', error);
      throw error;
    }
  }

  // Save weather preferences
  async saveWeatherPreferences(preferences) {
    try {
      const response = await fetch(`${this.baseUrl}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving weather preferences:', error);
      throw error;
    }
  }

  // Get weather preferences
  async getWeatherPreferences() {
    try {
      const response = await fetch(`${this.baseUrl}/preferences`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather preferences:', error);
      throw error;
    }
  }

  // Get weather analytics for performance correlation
  async getWeatherAnalytics(userId, dateRange) {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          dateRange
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather analytics:', error);
      throw error;
    }
  }
}

export default new WeatherService(); 