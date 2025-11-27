import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Thermometer, Settings, LogOut, Sprout, Map, Bot, CloudSun, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CloudSun, label: 'Weather', path: '/weather' },
    { icon: Bot, label: 'AI Advisor', path: '/advisor' },
    { icon: Cpu, label: 'Devices', path: '/devices' },
    { icon: Map, label: 'Zones', path: '/zones' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <motion.div
      className="flex h-screen bg-background"
      layoutId="shared-container"
      transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      {/* Sidebar */}
      <motion.aside
        className="w-64 bg-white border-r border-border flex flex-col"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Sprout size={20} />
          </div>
          <h1 className="font-bold text-xl text-primary-dark">KrishiSense</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                    }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        className="flex-1 overflow-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </motion.main>
    </motion.div>
  );
}
