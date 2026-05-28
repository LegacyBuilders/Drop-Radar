import { useState, useEffect, useCallback } from "react";

export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const updatePosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, []);

  useEffect(() => {
    updatePosition();

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation?.clearWatch(watchId);
      }
    };
  }, [updatePosition]);

  return { position, error, loading, refresh: updatePosition };
}