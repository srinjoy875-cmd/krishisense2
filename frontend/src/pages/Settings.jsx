import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Bell, Shield, Sliders } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const [threshold, setThreshold] = useState(40);
  const [autoMode, setAutoMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const { addToast } = useToast();

  const handleSave = () => {
    // In a real app, save to backend
    addToast('Settings saved successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
          <p className="text-text-secondary">Configure your system preferences</p>
        </div>
        <Button onClick={handleSave}>
          <Save size={20} />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Irrigation Settings */}
        <Card title="Irrigation Automation">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Sliders size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">Auto-Irrigation Mode</h4>
                  <p className="text-sm text-text-secondary">Automatically water when dry</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoMode}
                  onChange={(e) => setAutoMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary">Moisture Threshold</label>
                <span className="text-sm font-bold text-primary">{threshold}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-text-secondary mt-2">Pump turns ON when moisture drops below this value.</p>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card title="Notifications">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">Alerts & Warnings</h4>
                  <p className="text-sm text-text-secondary">Get notified for critical events</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card title="Account Security">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="font-medium text-text-primary">Change Password</h4>
                <p className="text-sm text-text-secondary">Update your login credentials</p>
              </div>
            </div>
            <Input type="password" placeholder="Current Password" />
            <Input type="password" placeholder="New Password" />
            <Button variant="secondary" className="w-full">Update Password</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
