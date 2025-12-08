import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Server, MapPin, Signal, Wifi, WifiOff, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ device_id: '', name: '', zone: '', location: '' });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const { data } = await api.get('/device/list');
      setDevices(data);
    } catch (error) {
      console.error("Failed to fetch devices", error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/device/register', newDevice);
      setShowModal(false);
      setNewDevice({ device_id: '', name: '', zone: '', location: '' });
      fetchDevices();
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message === 'Device already registered') {
        alert('Good news! Device is already connected. Refreshing list...');
        setShowModal(false);
        fetchDevices();
      } else {
        alert('Failed to register device');
      }
    }
  };

  const handleDelete = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      try {
        await api.delete(`/device/${deviceId}`);
        fetchDevices();
      } catch (error) {
        console.error("Failed to delete device", error);
        alert('Failed to delete device');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Devices</h2>
          <p className="text-text-secondary">Manage your IoT sensor nodes</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add Device
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <Card key={device.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <Server size={20} />
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${device.status === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {device.status === 'ONLINE' ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {device.status}
                </div>
                <button
                  onClick={() => handleDelete(device.device_id)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete Device"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-lg text-text-primary mb-1">{device.name || device.device_id}</h3>
            <p className="text-sm text-text-secondary mb-4 font-mono">{device.device_id}</p>

            <div className="flex items-center gap-4 text-sm text-text-secondary border-t border-border pt-4">
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                {device.location || 'N/A'}
              </div>
              <div className="flex items-center gap-1">
                <Signal size={14} />
                Zone {device.zone || '-'}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Device Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">Register New Device</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Device ID (Serial)"
                placeholder="e.g. KS-001"
                value={newDevice.device_id}
                onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                required
              />
              <Input
                label="Device Name"
                placeholder="e.g. North Field Sensor"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              />
              <Input
                label="Zone"
                placeholder="e.g. 1"
                value={newDevice.zone}
                onChange={(e) => setNewDevice({ ...newDevice, zone: e.target.value })}
              />
              <Input
                label="Location"
                placeholder="e.g. Greenhouse A"
                value={newDevice.location}
                onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
              />

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Register</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
