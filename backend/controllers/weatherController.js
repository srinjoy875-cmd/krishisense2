const axios = require('axios');



// Simple in-memory cache: { "lat,lon": { data, timestamp } }
const weatherCache = {};
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const TOMORROW_API_KEY = process.env.TOMORROW_API_KEY || 'p6DLTfKMxavCTvOg1PdmNA8WzfLW61Jo';

// Helper function to fetch weather (with cache)
const fetchWeatherData = async (lat, lon) => {
  if (!lat || !lon) return null;

  // Create a cache key (rounded to 2 decimal places)
  const cacheKey = `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;

  // Check cache
  if (weatherCache[cacheKey]) {
    const { data, timestamp } = weatherCache[cacheKey];
    if (Date.now() - timestamp < CACHE_DURATION) {
      console.log('Serving weather from cache (Internal)');
      return data;
    }
  }

  console.log('Fetching weather from Tomorrow.io (Internal)');
  try {
    const response = await axios.get('https://api.tomorrow.io/v4/weather/forecast', {
      params: {
        location: `${lat},${lon}`,
        apikey: TOMORROW_API_KEY,
        units: 'metric',
        fields: [
          "temperature", "humidity", "windSpeed", "windDirection", "precipitationProbability",
          "rainIntensity", "sleetIntensity", "snowIntensity", "temperatureApparent", "dewPoint",
          "windGust", "pressureSurfaceLevel", "pressureSeaLevel", "visibility", "cloudCover",
          "uvIndex", "uvHealthConcern", "weatherCode", "sunriseTime", "sunsetTime"
        ]
      },
      headers: {
        accept: 'application/json',
      }
    });

    const weatherData = response.data;

    // Save to cache
    weatherCache[cacheKey] = {
      data: weatherData,
      timestamp: Date.now()
    };

    return weatherData;
  } catch (error) {
    console.error('Error in fetchWeatherData:', error.response?.data || error.message);
    throw error;
  }
};

// @desc    Get weather forecast
// @route   GET /api/weather
// @access  Private
const getWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    const data = await fetchWeatherData(lat, lon);
    res.json(data);

  } catch (error) {
    console.error('Error fetching weather:', error.message);
    res.status(500).json({ message: 'Failed to fetch weather data' });
  }
};

module.exports = { getWeather, fetchWeatherData };
