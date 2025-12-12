import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return { success: true, data };
    } catch (error) {
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        // Client error (e.g. invalid credentials), just log warning
        console.warn('Login failed:', error.response.data.message);
      } else {
        // Server error or network issue
        console.error('Login error:', error);
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/signup', { name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return { success: true, data };
    } catch (error) {
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        console.warn('Signup failed:', error.response.data.message);
      } else {
        console.error('Signup error:', error);
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
