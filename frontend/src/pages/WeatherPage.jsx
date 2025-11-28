import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer,
  Calendar, MapPin, ArrowUp, ArrowDown, Umbrella, Eye,
  CloudLightning, CloudSnow, CloudSun
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useLocation } from '../context/LocationContext';
import { weatherApi } from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Helper to map Tomorrow.io weather codes to Lucide icons
const getWeatherIcon = (code) => {
  // Codes: https://docs.tomorrow.io/reference/data-layers-weather-codes
  const iconProps = { size: 32, className: "mb-2" };

  switch (code) {
    case 1000: return <Sun {...iconProps} className="text-orange-500" />; // Clear, Sunny
    case 1100: return <Sun {...iconProps} className="text-orange-400" />; // Mostly Clear
    case 1101: return <CloudSun {...iconProps} className="text-yellow-500" />; // Partly Cloudy
    case 1102: return <Cloud {...iconProps} className="text-gray-400" />; // Mostly Cloudy
    case 1001: return <Cloud {...iconProps} className="text-gray-500" />; // Cloudy
    case 4000: return <CloudRain {...iconProps} className="text-blue-400" />; // Drizzle
    case 4001: return <CloudRain {...iconProps} className="text-blue-600" />; // Rain
    case 4200: return <CloudRain {...iconProps} className="text-blue-300" />; // Light Rain
    case 4201: return <CloudRain {...iconProps} className="text-blue-700" />; // Heavy Rain
    case 8000: return <CloudLightning {...iconProps} className="text-purple-600" />; // Thunderstorm
    case 5000: return <CloudSnow {...iconProps} className="text-cyan-200" />; // Snow
    case 5100: return <CloudSnow {...iconProps} className="text-cyan-400" />; // Light Snow
    case 6000: return <CloudRain {...iconProps} className="text-cyan-600" />; // Freezing Rain
    default: return <Cloud {...iconProps} className="text-gray-400" />;
  }
};

// Helper Components
const SproutIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M7 20h10" />
    <path d="M10 20c5.5-2.5.8-6.4 3-10" />
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.2.4-4.8-.3-1.1-.6-2.3-1.9-3.3-2.4 6-1.6 4.3-7.1 5.8-1" />
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
  </svg>
);

const InsightItem = ({ label, status, color, desc }) => {
  const colors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700"
  };

  return (
    <div className="flex items-start gap-4 p-3 rounded-xl bg-gray-50">
      <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${colors[color]}`}>
        {status}
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </div>
  );
};

const LocationModal = ({ onClose, detectLocation, manualSetLocation }) => {
  const [cityQuery, setCityQuery] = useState('');
  const [manualCoords, setManualCoords] = useState({ lat: '', lon: '' });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleCitySearch = async (e) => {
    e.preventDefault();
    if (!cityQuery.trim()) return;

    setSearchLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectCity = (result) => {
    manualSetLocation(parseFloat(result.lat), parseFloat(result.lon), result.display_name.split(',')[0]);
    onClose();
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const lat = parseFloat(manualCoords.lat);
    const lon = parseFloat(manualCoords.lon);

    if (!isNaN(lat) && !isNaN(lon)) {
      // Reverse geocode to get location name
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();

        // Try to find the most relevant name
        const locationName =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.hamlet ||
          data.address?.suburb ||
          data.address?.county ||
          data.display_name?.split(',')[0] ||
          `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;

        manualSetLocation(lat, lon, locationName);
      } catch (err) {
        console.error("Reverse geocoding error:", err);
        manualSetLocation(lat, lon, `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Select Location</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Option 1: Auto Detect */}
          <div>
            <button
              onClick={() => { detectLocation(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors"
            >
              <MapPin size={18} />
              Detect My Location
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Option 2: Search City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search City</label>
            <form onSubmit={handleCitySearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter city name..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50"
              >
                {searchLoading ? '...' : 'Search'}
              </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectCity(result)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 truncate"
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Option 3: Manual Coordinates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter Coordinates</label>
            <form onSubmit={handleManualSubmit} className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={manualCoords.lat}
                onChange={(e) => setManualCoords({ ...manualCoords, lat: e.target.value })}
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={manualCoords.lon}
                onChange={(e) => setManualCoords({ ...manualCoords, lon: e.target.value })}
                required
              />
              <button
                type="submit"
                className="col-span-2 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium"
              >
                Set Coordinates
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Weather() {
  const { location, detectLocation, manualSetLocation } = useLocation();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'charts'
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      if (location.lat && location.lon) {
        setLoading(true);
        try {
          const { data } = await weatherApi.getForecast(location.lat, location.lon);
          setWeatherData(data);
        } catch (err) {
          console.error("Weather fetch error:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchWeather();
  }, [location]);

  if (loading && !weatherData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!weatherData && !loading) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-semibold text-gray-700">Weather data unavailable</h2>
        <button onClick={() => setShowLocationModal(true)} className="mt-4 text-primary hover:underline">
          Select Location
        </button>
      </div>
    );
  }

  const current = weatherData?.timelines?.minutely?.[0]?.values || weatherData?.timelines?.hourly?.[0]?.values;
  const daily = weatherData?.timelines?.daily || [];
  const hourly = weatherData?.timelines?.hourly?.slice(0, 24) || [];

  // Chart Data Preparation
  const hourlyLabels = hourly.map(h => new Date(h.time).toLocaleTimeString([], { hour: '2-digit' }));

  const tempChartData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: hourly.map(h => h.values.temperature),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const rainChartData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: 'Precipitation Probability (%)',
        data: hourly.map(h => h.values.precipitationProbability),
        backgroundColor: 'rgb(59, 130, 246)',
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f3f4f6' } }
    }
  };

  return (
    <div className="space-y-6 pb-10 relative">
      {/* Location Modal */}
      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          detectLocation={detectLocation}
          manualSetLocation={manualSetLocation}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weather Insights</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin size={16} />
              <span className="font-medium">{location.name}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => setShowLocationModal(true)}
              className="text-xs text-primary font-medium hover:underline bg-primary/10 px-2 py-1 rounded-md"
            >
              Change
            </button>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'charts' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Charts & Trends
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Current Weather Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Cloud size={200} />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                  <div className="text-blue-100 font-medium mb-2">Current Conditions</div>
                  <div className="text-7xl font-bold tracking-tighter">
                    {current.temperature.toFixed(1)}°
                  </div>
                  <div className="text-xl text-blue-100 mt-2 flex items-center justify-center md:justify-start gap-2">
                    {getWeatherIcon(current.weatherCode)}
                    Feels like {current.temperatureApparent.toFixed(1)}°
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg"><Wind size={20} /></div>
                    <div>
                      <div className="text-sm text-blue-100">Wind</div>
                      <div className="font-semibold text-lg">{current.windSpeed.toFixed(1)} m/s</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg"><Droplets size={20} /></div>
                    <div>
                      <div className="text-sm text-blue-100">Humidity</div>
                      <div className="font-semibold text-lg">{current.humidity.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg"><Umbrella size={20} /></div>
                    <div>
                      <div className="text-sm text-blue-100">Rain Chance</div>
                      <div className="font-semibold text-lg">{current.precipitationProbability}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg"><Eye size={20} /></div>
                    <div>
                      <div className="text-sm text-blue-100">Visibility</div>
                      <div className="font-semibold text-lg">{current.visibility.toFixed(1)} km</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Agri-Insights Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <SproutIcon className="text-green-500" />
                Agri-Insights
              </h3>

              <div className="space-y-4 flex-1">
                <InsightItem
                  label="Irrigation"
                  status={current.precipitationProbability > 40 ? "Skip" : "Recommended"}
                  color={current.precipitationProbability > 40 ? "red" : "green"}
                  desc={current.precipitationProbability > 40 ? "Rain expected soon." : "Low moisture, good time to water."}
                />
                <InsightItem
                  label="Spraying"
                  status={current.windSpeed > 5 ? "Avoid" : "Optimal"}
                  color={current.windSpeed > 5 ? "red" : "green"}
                  desc={current.windSpeed > 5 ? "High winds may cause drift." : "Calm winds, safe to spray."}
                />
                <InsightItem
                  label="Harvest"
                  status={current.humidity > 80 ? "Wait" : "Good"}
                  color={current.humidity > 80 ? "yellow" : "green"}
                  desc={current.humidity > 80 ? "High humidity affects drying." : "Conditions are dry."}
                />
              </div>
            </motion.div>
          </div>

          {/* Advanced Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-xs font-medium uppercase mb-1">UV Index</div>
              <div className="text-2xl font-bold text-gray-800">{current.uvIndex || 0}</div>
              <div className="text-xs text-gray-400 mt-1">
                {current.uvIndex > 5 ? 'High' : 'Low/Moderate'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-xs font-medium uppercase mb-1">Cloud Cover</div>
              <div className="text-2xl font-bold text-gray-800">{current.cloudCover || 0}%</div>
              <div className="text-xs text-gray-400 mt-1">
                {current.cloudCover > 50 ? 'Overcast' : 'Clear/Partly'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-xs font-medium uppercase mb-1">Pressure</div>
              <div className="text-2xl font-bold text-gray-800">{current.pressureSurfaceLevel || 1013} hPa</div>
              <div className="text-xs text-gray-400 mt-1">Sea Level: {current.pressureSeaLevel} hPa</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-xs font-medium uppercase mb-1">Dew Point</div>
              <div className="text-2xl font-bold text-gray-800">{current.dewPoint || 0}°C</div>
              <div className="text-xs text-gray-400 mt-1">Humidity: {current.humidity}%</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-xs font-medium uppercase mb-1">Wind Gust</div>
              <div className="text-2xl font-bold text-gray-800">{current.windGust || 0} m/s</div>
              <div className="text-xs text-gray-400 mt-1">Dir: {current.windDirection}°</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-xs font-medium uppercase mb-1">Visibility</div>
              <div className="text-2xl font-bold text-gray-800">{current.visibility || 10} km</div>
              <div className="text-xs text-gray-400 mt-1">Clear view</div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">7-Day Forecast</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {daily.map((day, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-center"
                >
                  <div className="text-sm text-gray-500 font-medium mb-2">
                    {new Date(day.time).toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                  </div>
                  <div className="my-3 flex justify-center">
                    {getWeatherIcon(day.values.weatherCodeMax)}
                  </div>
                  <div className="flex justify-center items-center gap-3 mb-2">
                    <span className="font-bold text-gray-800">{Math.round(day.values.temperatureMax)}°</span>
                    <span className="text-gray-400 text-sm">{Math.round(day.values.temperatureMin)}°</span>
                  </div>
                  <div className="flex justify-center items-center gap-1 text-xs text-blue-500 font-medium bg-blue-50 py-1 rounded-full">
                    <Umbrella size={12} />
                    {day.values.precipitationProbabilityAvg}%
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">24h Temperature Trend</h3>
            <Line data={tempChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Precipitation Chance</h3>
            <Bar data={rainChartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
}