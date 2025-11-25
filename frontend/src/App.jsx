import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Zones from './pages/Zones';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" />} />
          <Route path="/signup" element={<Navigate to="/auth" />} />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/devices" element={
            <ProtectedRoute>
              <Layout>
                <Devices />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/zones" element={
            <ProtectedRoute>
              <Layout>
                <Zones />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
