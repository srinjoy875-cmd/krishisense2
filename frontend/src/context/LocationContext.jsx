import React, { createContext, useState, useContext } from 'react';

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
        // Handle specific error codes
        let errorMessage = 'Unable to retrieve your location';
        let errorType = 'general';

        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location access is blocked by your browser. Please enable permissions in the URL bar.';
            errorType = 'denied';
            break;
          case 2: // POSITION_UNAVAILABLE
          case 3: // TIMEOUT
            errorMessage = 'Location unavailable. Please check your connection or try searching for your city.';
            errorType = 'unavailable';
            break;
        }

        setError({ message: errorMessage, type: errorType, details: err });
        setLoading(false);
        console.error("Geolocation error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
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
