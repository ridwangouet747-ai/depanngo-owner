import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Star, MapPin, Filter } from "lucide-react";
import { MobileShell } from "../MobileShell";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRepairers } from "../hooks/useRepairers";
import { haversineKm, SAN_PEDRO_CENTER } from "@/lib/haversine";
import { pickName, formatFCFA } from "@/lib/supabaseExternal";

// Fix default marker icons in Vite
const orangeIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:hsl(24 100% 50%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">🔧</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const meIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(217 91% 60%);border:3px solid white;box-shadow:0 0 0 4px hsl(217 91% 60% / 0.2);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type Sort = "distance" | "rating" | "price";

export default function Reparateurs() {
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const { data: repairers, isLoading } = useRepairers();
  const [sort, setSort] = useState<Sort>("distance");

  const center = position ?? { ...SAN_PEDRO_CENTER, source: "fallback" as const };

  const enriched = useMemo(() => {
    return (repairers ?? []).map((r) => {
      const lat = (r as any).latitude ?? SAN_PEDRO_CENTER.lat + (Math.random() - 0.5) * 0.04;
      const lng = (r as any).longitude ?? SAN_PEDRO_CENTER.lng + (Math.random() - 0.5) * 0.04;
      const distance = haversineKm(center.lat, center.lng, lat, lng);
      const rating = Number((r as any).average_rating ?? r.rating ?? 4.5);
      const trust = Number((r as any).trust_score ?? 75);
      const price = 5000 + Math.round((100 - trust) * 50);
      return { ...r, lat, lng, distance, rating, trust, price };
    });
  }, [repairers, center.lat, center.lng]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    if (sort === "distance") arr.sort((a, b) => a.distance - b.distance);
    if (sort === "rating") arr.sort((a, b) => b.rating - a.rating);
    if (sort === "price") arr.sort((a, b) => a.price - b.price);
    return arr;
  }, [enriched, sort]);

  return (
    <MobileShell>
      <div className="px-5 pt-4 flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="font-bold text-brand-navy">Réparateurs disponibles</div>
          <div className="text-xs text-gray-500">{sorted.length} pros près de vous</div>
        </div>
      </div>

      <div className="px-5">
        <div className="rounded-2xl overflow-hidden border border-border h-48 mb-4">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[center.lat, center.lng]} icon={meIcon}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
            {sorted.slice(0, 20).map((r) => (
              <Marker key={r.id} position={[r.lat, r.lng]} icon={orangeIcon}
                eventHandlers={{ click: () => navigate(`/app/reparateur/${r.id}`) }}
              >
                <Popup>{pickName(r as any)}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="flex items-center gap-2 mb-3 overflow-x-auto">
          <Filter size={14} className="text-gray-400 shrink-0" />
          {(["distance", "rating", "price"] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                sort === s ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {s === "distance" ? "Plus proches" : s === "rating" ? "Mieux notés" : "Moins chers"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))
            : sorted.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/app/reparateur/${r.id}`)}
                  className="w-full bg-white rounded-2xl p-4 shadow-card flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-primary-soft text-brand-primary flex items-center justify-center font-bold text-xl shrink-0">
                    {pickName(r as any).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-brand-navy truncate">{pickName(r as any)}</div>
                      {((r as any).is_available || r.is_online) && (
                        <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {(r as any).specialty || (Array.isArray((r as any).specialties) ? (r as any).specialties.join(", ") : "Technicien")}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="flex items-center gap-1 font-semibold text-brand-navy">
                        <Star size={12} className="fill-brand-warning text-brand-warning" />
                        {r.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <MapPin size={11} /> {r.distance.toFixed(1)} km
                      </span>
                      <span className="text-brand-primary font-semibold">dès {formatFCFA(r.price)}</span>
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </div>
    </MobileShell>
  );
}
