import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { AuthTransition, AppTransition } from './components/PageTransition';
import Dashboard from './pages/Dashboard';
import Weather from './pages/WeatherPage';
import Devices from './pages/Devices';
import Zones from './pages/Zones';
import Settings from './pages/Settings';
import AIAdvisor from './pages/AIAdvisor';
import AuthPage from './pages/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return children;
};

function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <LocationProvider>
        <ToastProvider>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/auth" element={
                <AuthTransition>
                  <AuthPage />
                </AuthTransition>
              } />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/signup" element={<Navigate to="/auth" replace />} />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppTransition>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </AppTransition>
                </ProtectedRoute>
              } />
              <Route path="/weather" element={
                <ProtectedRoute>
                  <AppTransition>
                    <Layout>
                      <Weather />
                    </Layout>
                  </AppTransition>
                </ProtectedRoute>
              } />
              <Route path="/advisor" element={
                <ProtectedRoute>
                  <AppTransition>
                    <Layout>
                      <AIAdvisor />
                    </Layout>
                  </AppTransition>
                </ProtectedRoute>
              } />
              <Route path="/devices" element={
                <ProtectedRoute>
                  <AppTransition>
                    <Layout>
                      <Devices />
                    </Layout>
                  </AppTransition>
                </ProtectedRoute>
              } />
              <Route path="/zones" element={
                <ProtectedRoute>
                  <AppTransition>
                    <Layout>
                      <Zones />
                    </Layout>
                  </AppTransition>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <AppTransition>
                    <Layout>
                      <Settings />
                    </Layout>
                  </AppTransition>
                </ProtectedRoute>
              } />
            </Routes>
          </AnimatePresence>
        </ToastProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
