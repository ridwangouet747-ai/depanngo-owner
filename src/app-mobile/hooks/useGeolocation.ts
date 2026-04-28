import { useEffect, useState } from "react";
import { SAN_PEDRO_CENTER } from "@/lib/haversine";

export interface GeoPoint {
  lat: number;
  lng: number;
  source: "gps" | "fallback";
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setPosition({ ...SAN_PEDRO_CENTER, source: "fallback" });
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setPosition((p) => p ?? { ...SAN_PEDRO_CENTER, source: "fallback" });
      setLoading(false);
    }, 5000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: "gps" });
        setLoading(false);
      },
      (err) => {
        clearTimeout(timer);
        setError(err.message);
        setPosition({ ...SAN_PEDRO_CENTER, source: "fallback" });
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 4500, maximumAge: 60000 }
    );
    return () => clearTimeout(timer);
  }, []);

  return { position, loading, error };
}
