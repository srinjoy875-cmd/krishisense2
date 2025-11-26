import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { LineChart } from '../components/ui/Chart';
import { Droplets, Thermometer, Wind, Activity, Sun, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const [sensorData, setSensorData] = useState({
    moisture: 0,
    temperature: 0,
    humidity: 0,
    sunlight: 0,
    pumpStatus: 'OFF'
  });

  const [history, setHistory] = useState({
    labels: [],
    moisture: [],
    temperature: [],
    humidity: [],
    sunlight: []
  });

  const [loading, setLoading] = useState(true);

  // 1. Fetch List of Devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await api.get('/device/list');
        if (res.data && res.data.length > 0) {
          setDevices(res.data);
          setSelectedDeviceId(res.data[0].device_id); // Default to first device
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };
    fetchDevices();
  }, []);

  // 2. Fetch Data for Selected Device
  useEffect(() => {
    if (!selectedDeviceId) return;

    const fetchData = async () => {
      try {
        const [latestRes, historyRes] = await Promise.all([
          api.get(`/sensor/latest/${selectedDeviceId}`),
          api.get(`/sensor/history/${selectedDeviceId}`)
        ]);

        if (latestRes.data) {
          const rawSunlight = latestRes.data.sunlight || 4095;
          const sunlightPercent = Math.max(0, Math.min(100, Math.round((1 - (rawSunlight / 4095)) * 100)));

          setSensorData({
            moisture: latestRes.data.moisture || 0,
            temperature: latestRes.data.temperature || 0,
            humidity: latestRes.data.humidity || 0,
            sunlight: sunlightPercent,
            pumpStatus: 'OFF'
          });
        } else {
          // Reset if no data
          setSensorData({ moisture: 0, temperature: 0, humidity: 0, sunlight: 0, pumpStatus: 'OFF' });
        }

        if (historyRes.data) {
          const reversed = [...historyRes.data].reverse();
          setHistory({
            labels: reversed.map(d => new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            moisture: reversed.map(d => d.moisture),
            temperature: reversed.map(d => d.temperature),
            humidity: reversed.map(d => d.humidity),
            sunlight: reversed.map(d => Math.max(0, Math.min(100, Math.round((1 - ((d.sunlight || 4095) / 4095)) * 100))))
          });
        } else {
          setHistory({ labels: [], moisture: [], temperature: [], humidity: [], sunlight: [] });
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [selectedDeviceId]); // Re-run when device changes

  const StatCard = ({ title, value, unit, icon: Icon, color, subtext }) => (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-text-secondary text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-text-primary">
          {value}<span className="text-lg text-text-secondary font-normal ml-1">{unit}</span>
        </h3>
        {subtext && <p className="text-xs text-text-secondary mt-2">{subtext}</p>}
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
          <span className="text-sm text-text-secondary">Real-time monitoring</span>
        </div>

        {/* Device Selector */}
        <div className="relative">
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="appearance-none bg-white border border-gray-200 text-text-primary py-2 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[200px]"
          >
            {devices.length === 0 && <option>No Devices Found</option>}
            {devices.map(d => (
              <option key={d.device_id} value={d.device_id}>
                {d.name || d.device_id}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Soil Moisture"
          value={sensorData.moisture}
          unit="%"
          icon={Droplets}
          color="bg-blue-500"
          subtext="Optimal range: 40-60%"
        />
        <StatCard
          title="Temperature"
          value={sensorData.temperature}
          unit="°C"
          icon={Thermometer}
          color="bg-orange-500"
          subtext="Normal"
        />
        <StatCard
          title="Humidity"
          value={sensorData.humidity}
          unit="%"
          icon={Wind}
          color="bg-cyan-500"
          subtext="Air humidity"
        />
        <StatCard
          title="Sunlight"
          value={sensorData.sunlight}
          unit="%"
          icon={Sun}
          color="bg-yellow-500"
          subtext="Light Intensity"
        />
        <StatCard
          title="Pump Status"
          value={sensorData.pumpStatus}
          unit=""
          icon={Activity}
          color={sensorData.pumpStatus === 'ON' ? 'bg-green-500' : 'bg-gray-400'}
          subtext="Auto mode active"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Moisture Trends" className="h-[400px]">
          <div className="h-[320px]">
            <LineChart
              title="Soil Moisture (%)"
              color="#3A7D44"
              data={{
                labels: history.labels,
                datasets: [{
                  label: 'Moisture',
                  data: history.moisture,
                }]
              }}
            />
          </div>
        </Card>

        <Card title="Temperature Trends" className="h-[400px]">
          <div className="h-[320px]">
            <LineChart
              title="Temperature (°C)"
              color="#F97316"
              data={{
                labels: history.labels,
                datasets: [{
                  label: 'Temperature',
                  data: history.temperature,
                }]
              }}
            />
          </div>
        </Card>

        <Card title="Humidity Trends" className="h-[400px]">
          <div className="h-[320px]">
            <LineChart
              title="Humidity (%)"
              color="#06B6D4"
              data={{
                labels: history.labels,
                datasets: [{
                  label: 'Humidity',
                  data: history.humidity,
                }]
              }}
            />
          </div>
        </Card>

        <Card title="Sunlight Trends" className="h-[400px]">
          <div className="h-[320px]">
            <LineChart
              title="Sunlight (%)"
              color="#EAB308"
              data={{
                labels: history.labels,
                datasets: [{
                  label: 'Sunlight',
                  data: history.sunlight,
                }]
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

