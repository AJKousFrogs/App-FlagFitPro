import React, { useState, useEffect } from 'react';
import { 
  BoltIcon, 
  SunIcon, 
  CloudIcon, 
  CloudRainIcon,
  CloudSnowIcon,
  HomeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const WeatherSystem = () => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [location, setLocation] = useState(null);
  const [performanceImpact, setPerformanceImpact] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Backend Integration - Fetch weather data
  useEffect(() => {
    if (user) {
      fetchUserLocation();
    }
  }, [user]);

  useEffect(() => {
    if (location) {
      fetchWeatherData();
    }
  }, [location]);

  const fetchUserLocation = async () => {
    try {
      const response = await fetch('/api/user/location', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocation(data.location);
      } else {
        // Fallback to browser geolocation
        getCurrentPosition();
      }
    } catch (error) {
      console.error('Error fetching user location:', error);
      getCurrentPosition();
    }
  };

  const getCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: 'Current Location'
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Default to a fallback location
          setLocation({ lat: 40.7128, lon: -74.0060, name: 'New York' });
        }
      );
    }
  };

  const fetchWeatherData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          includeForecast: true,
          includeAlerts: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentWeather(data.current);
        setForecast(data.forecast);
        setAlerts(data.alerts);
        calculatePerformanceImpact(data.current);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Backend Integration - Calculate performance impact
  const calculatePerformanceImpact = (weather) => {
    if (!weather) return;

    const impact = {
      passing: 0,
      running: 0,
      endurance: 0,
      injuryRisk: 'Low',
      recommendations: []
    };

    // Temperature impact
    if (weather.temp > 85) {
      impact.endurance -= 15;
      impact.injuryRisk = 'High';
      impact.recommendations.push('Extra hydration every 15 minutes');
    } else if (weather.temp < 40) {
      impact.running -= 10;
      impact.recommendations.push('Warm up for 20 minutes minimum');
    }

    // Wind impact
    if (weather.windSpeed > 15) {
      impact.passing -= 20;
      impact.recommendations.push('Adjust passing strategy for wind');
    } else if (weather.windSpeed > 10) {
      impact.passing -= 10;
    }

    // Humidity impact
    if (weather.humidity > 80) {
      impact.endurance -= 10;
      impact.recommendations.push('Monitor hydration levels closely');
    }

    // Precipitation impact
    if (weather.conditions.includes('rain')) {
      impact.passing -= 15;
      impact.running -= 5;
      impact.recommendations.push('Use weather-appropriate equipment');
    }

    setPerformanceImpact(impact);
  };

  // Backend Integration - Save weather preferences
  const saveWeatherPreferences = async (preferences) => {
    try {
      const response = await fetch('/api/user/weather-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        console.log('Weather preferences saved');
      }
    } catch (error) {
      console.error('Error saving weather preferences:', error);
    }
  };

  // Backend Integration - Get weather history
  const getWeatherHistory = async () => {
    try {
      const response = await fetch('/api/weather/history', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.history;
      }
    } catch (error) {
      console.error('Error fetching weather history:', error);
    }
  };

  // Backend Integration - Report weather incident
  const reportWeatherIncident = async (incident) => {
    try {
      const response = await fetch('/api/weather/incident', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incident)
      });
      
      if (response.ok) {
        console.log('Weather incident reported');
      }
    } catch (error) {
      console.error('Error reporting weather incident:', error);
    }
  };

  const getRiskLevel = (weather) => {
    if (!weather) return 'Unknown';
    
    let risk = 0;
    if (weather.temp > 90 || weather.temp < 35) risk += 3;
    if (weather.windSpeed > 20) risk += 2;
    if (weather.conditions.includes('thunderstorm')) risk += 3;
    if (weather.conditions.includes('snow')) risk += 2;
    
    if (risk >= 5) return 'High';
    if (risk >= 3) return 'Medium';
    return 'Low';
  };

  const getWeatherIcon = (conditions) => {
    if (conditions.includes('thunderstorm')) return <BoltIcon className="h-6 w-6 text-yellow-500" />;
    if (conditions.includes('rain')) return <CloudRainIcon className="h-6 w-6 text-blue-500" />;
    if (conditions.includes('snow')) return <CloudSnowIcon className="h-6 w-6 text-blue-300" />;
    if (conditions.includes('cloud')) return <CloudIcon className="h-6 w-6 text-gray-500" />;
    if (conditions.includes('clear')) return <SunIcon className="h-6 w-6 text-yellow-500" />;
    return <SunIcon className="h-6 w-6 text-yellow-400" />;
  };

  if (isLoading) {
    return (
      <div className="weather-system">
        <div className="weather-loading">Loading weather data...</div>
      </div>
    );
  }

  return (
    <div className="weather-system">
      <div className="weather-header">
        <h3>🌤️ Weather & Environmental Conditions</h3>
        <span className="location">{location?.name}</span>
      </div>

      {currentWeather && (
        <div className="current-weather">
          <div className="weather-main">
            <div className="weather-icon">
              {getWeatherIcon(currentWeather.conditions)}
            </div>
            <div className="weather-details">
              <div className="temperature">{Math.round(currentWeather.temp)}°F</div>
              <div className="conditions">{currentWeather.conditions}</div>
              <div className="wind">💨 {currentWeather.windSpeed}mph {currentWeather.windDirection}</div>
              <div className="humidity">💧 {currentWeather.humidity}% Humidity</div>
            </div>
          </div>

          <div className="performance-impact">
            <h4 className="flex items-center gap-2">
            <HomeIcon className="h-5 w-5" />
            Performance Impact
          </h4>
            <div className="impact-metrics">
              <div className="metric">
                <span>Passing:</span>
                <span className={performanceImpact.passing >= 0 ? 'positive' : 'negative'}>
                  {performanceImpact.passing >= 0 ? '+' : ''}{performanceImpact.passing}%
                </span>
              </div>
              <div className="metric">
                <span>Running:</span>
                <span className={performanceImpact.running >= 0 ? 'positive' : 'negative'}>
                  {performanceImpact.running >= 0 ? '+' : ''}{performanceImpact.running}%
                </span>
              </div>
              <div className="metric">
                <span>Endurance:</span>
                <span className={performanceImpact.endurance >= 0 ? 'positive' : 'negative'}>
                  {performanceImpact.endurance >= 0 ? '+' : ''}{performanceImpact.endurance}%
                </span>
              </div>
            </div>
            <div className="risk-level">
              Risk Level: <span className={`risk-${performanceImpact.injuryRisk.toLowerCase()}`}>
                {performanceImpact.injuryRisk}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="weather-forecast">
        <h4>📅 Upcoming Events</h4>
        <div className="forecast-grid">
          {forecast.slice(0, 4).map((day, index) => (
            <div key={index} className="forecast-item">
              <div className="forecast-time">{day.time}</div>
              <div className="forecast-icon">{getWeatherIcon(day.conditions)}</div>
              <div className="forecast-temp">{Math.round(day.temp)}°F</div>
              <div className="forecast-wind">{day.windSpeed}mph</div>
              <div className={`forecast-risk risk-${getRiskLevel(day).toLowerCase()}`}>
                {getRiskLevel(day)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="weather-alerts">
          <h4>🚨 Weather Alerts</h4>
          {alerts.map((alert, index) => (
            <div key={index} className="alert-item">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                <div className="alert-description">{alert.description}</div>
                <div className="alert-time">{alert.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {performanceImpact.recommendations.length > 0 && (
        <div className="weather-recommendations">
          <h4>💡 Recommendations</h4>
          <ul>
            {performanceImpact.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="weather-actions">
        <button onClick={() => window.location.href = '/weather/forecast'}>
                      <ChartBarIcon className="h-5 w-5" /> Extended Forecast
        </button>
        <button onClick={() => window.location.href = '/weather/history'}>
                      <ChartBarIcon className="h-5 w-5" /> Weather History
        </button>
        <button onClick={() => window.location.href = '/weather/settings'}>
          ⚙️ Weather Settings
        </button>
      </div>
    </div>
  );
};

export default WeatherSystem; 