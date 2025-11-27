import React, { createContext, useState, useContext, useEffect } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  // Default to New Delhi if detection fails
  const [location, setLocation] = useState({
    lat: 28.61,
    lon: 77.20,
    name: 'New Delhi (Default)',
    isAuto: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detectLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: 'Current Location',
          isAuto: true
        });
        setLoading(false);
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLoading(false);
        console.error("Geolocation error:", err);
      }
    );
  };

  const manualSetLocation = (lat, lon, name) => {
    setLocation({ lat, lon, name, isAuto: false });
  };

  return (
    <LocationContext.Provider value={{ location, loading, error, detectLocation, manualSetLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
