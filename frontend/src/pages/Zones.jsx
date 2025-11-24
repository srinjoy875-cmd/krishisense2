import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Droplets, Sun, Thermometer } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Zones() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchZones = async () => {
    try {
      // 1. Get list of devices
      const devicesRes = await api.get('/device/list');
      const deviceList = devicesRes.data;

      // 2. Get latest data for each device
      const devicesWithData = await Promise.all(deviceList.map(async (device) => {
        try {
          const sensorRes = await api.get(`/sensor/latest/${device.device_id}`);
          return { ...device, sensorData: sensorRes.data || {} };
        } catch (e) {
          return { ...device, sensorData: {} };
        }
      }));

      setDevices(devicesWithData);
    } catch (error) {
      console.error("Error fetching zones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    const interval = setInterval(fetchZones, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleIrrigate = async (deviceId) => {
    try {
      await api.post('/irrigation/control', {
        device_id: deviceId,
        command: 'ON'
      });
      addToast(`Irrigation started for ${deviceId}`, 'success');
    } catch (error) {
      console.error("Error starting irrigation:", error);
      addToast("Failed to start irrigation", 'error');
    }
  };

  if (loading) return <div className="p-6">Loading Zones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Zones</h2>
          <p className="text-text-secondary">Monitor irrigation status by zone</p>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No devices found. Please register a device in the "Devices" tab.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const data = device.sensorData || {};
            const isDry = data.moisture < 40; // Example threshold

            return (
              <Card key={device.id} className="relative overflow-hidden">
                {/* Background Gradient */}
                <div className={`absolute inset-0 opacity-10 pointer-events-none ${isDry ? 'bg-orange-500' : 'bg-primary'}`} />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">{device.name || device.device_id}</h3>
                      <p className="text-xs text-text-secondary">{device.location || 'No Location'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${device.status === 'OFFLINE'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-green-100 text-green-700'
                      }`}>
                      {device.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <Droplets size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Moisture</p>
                        <p className="font-bold text-lg">{data.moisture !== undefined ? `${data.moisture}%` : '--'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                        <Thermometer size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Temp</p>
                        <p className="font-bold text-lg">{data.temperature !== undefined ? `${data.temperature}°C` : '--'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={isDry ? 'primary' : 'secondary'}
                      className="w-full text-sm"
                      onClick={() => handleIrrigate(device.device_id)}
                    >
                      Irrigate Now
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
