import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Filter, Map } from "lucide-react";
import { MobileShell } from "../MobileShell";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRepairers } from "../hooks/useRepairers";
import { haversineKm, SAN_PEDRO_CENTER } from "@/lib/haversine";
import { pickName, formatFCFA } from "@/lib/supabaseExternal";

type Sort = "distance" | "rating" | "price";

export default function Reparateurs() {
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const { data: repairers, isLoading } = useRepairers();
  const [sort, setSort] = useState<Sort>("distance");

  const center = position ?? { ...SAN_PEDRO_CENTER, source: "fallback" as const };

  const enriched = useMemo(() => {
    return (repairers ?? []).map((r) => {
      const lat = (r as any).latitude ?? SAN_PEDRO_CENTER.lat;
      const lng = (r as any).longitude ?? SAN_PEDRO_CENTER.lng;
      const distance = haversineKm(center.lat, center.lng, lat, lng);
      const rating = Number((r as any).average_rating ?? 4.5);
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
      {/* Header */}
      <div className="px-5 pt-4 flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="font-bold text-brand-navy">Réparateurs disponibles</div>
          <div className="text-xs text-gray-500">{sorted.length} pros près de vous</div>
        </div>
      </div>

      {/* Carte statique San Pedro */}
      <div className="px-5 mb-4">
        <div className="rounded-2xl overflow-hidden border border-border h-44 bg-brand-primary-soft flex items-center justify-center">
          <div className="text-center">
            <Map size={32} className="text-brand-primary mx-auto mb-2" />
            <div className="text-sm font-semibold text-brand-navy">San Pedro, Côte d'Ivoire</div>
            <div className="text-xs text-gray-500">{sorted.length} réparateurs dans votre zone</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
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
      </div>

      {/* Liste réparateurs */}
      <div className="px-5 pb-24 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔧</div>
            <div className="font-semibold text-brand-navy mb-1">Aucun réparateur disponible</div>
            <div className="text-sm text-gray-500">De nouveaux réparateurs arrivent bientôt à San Pedro</div>
          </div>
        ) : (
          sorted.map((r) => (
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
                  {(r as any).is_available && (
                    <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {Array.isArray((r as any).specialties)
                    ? (r as any).specialties.join(", ")
                    : (r as any).specialty ?? "Technicien"}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-brand-navy">
                    <Star size={12} className="fill-brand-warning text-brand-warning" />
                    {r.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <MapPin size={11} /> {r.distance.toFixed(1)} km
                  </span>
                  <span className="text-brand-primary font-semibold">
                    dès {formatFCFA(r.price)}
                  </span>
                </div>
              </div>
              {/* Trust Score badge */}
              <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                r.trust >= 80 ? "bg-green-100 text-green-700" :
                r.trust >= 50 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {r.trust}
              </div>
            </button>
          ))
        )}
      </div>
    </MobileShell>
  );
}