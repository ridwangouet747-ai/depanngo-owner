import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Star, CreditCard, Users } from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRepairers } from "../hooks/useRepairers";
import { haversineKm, SAN_PEDRO_CENTER } from "@/lib/haversine";
import { pickName, formatFCFA } from "@/lib/supabaseExternal";

type Sort = "distance" | "rating" | "price" | "available";

export default function Reparateurs() {
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const { data: repairers, isLoading } = useRepairers();
  const [sort, setSort] = useState<Sort>("distance");
  const [searchParams] = useSearchParams();
  const catFilter = searchParams.get("cat") ?? "";
  const searchFilter = searchParams.get("search") ?? "";

  const center = position ?? { ...SAN_PEDRO_CENTER, source: "fallback" as const };

  const enriched = useMemo(() => {
    return (repairers ?? [])
      .filter((r) => {
        const specs = Array.isArray((r as any).specialties)
          ? (r as any).specialties
          : [(r as any).specialty ?? ""];
        if (catFilter) {
          const match = specs.some((s: string) =>
            s.toLowerCase().includes(catFilter.toLowerCase())
          );
          if (!match) return false;
        }
        if (searchFilter) {
          const name = pickName(r as any).toLowerCase();
          const specStr = specs.join(" ").toLowerCase();
          if (!name.includes(searchFilter) && !specStr.includes(searchFilter)) return false;
        }
        return true;
      })
      .map((r) => {
        const lat = (r as any).latitude ?? SAN_PEDRO_CENTER.lat;
        const lng = (r as any).longitude ?? SAN_PEDRO_CENTER.lng;
        const distance = haversineKm(center.lat, center.lng, lat, lng);
        const rating = Number((r as any).average_rating ?? 4.5);
        const trust = Number((r as any).trust_score ?? 75);
        const price = 5000 + Math.round((100 - trust) * 50);
        return { ...r, lat, lng, distance, rating, trust, price };
      });
  }, [repairers, center.lat, center.lng, catFilter, searchFilter]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    if (sort === "distance") arr.sort((a, b) => a.distance - b.distance);
    if (sort === "rating") arr.sort((a, b) => b.rating - a.rating);
    if (sort === "price") arr.sort((a, b) => a.price - b.price);
    if (sort === "available") return arr.filter((r) => (r as any).is_available);
    return arr;
  }, [enriched, sort]);

  const pageTitle = catFilter
    ? `Spécialistes ${catFilter}`
    : searchFilter
    ? `"${searchFilter}"`
    : "Réparateurs";

  const FILTERS: { id: Sort; label: string }[] = [
    { id: "distance",  label: "Plus proches" },
    { id: "rating",    label: "Mieux notés" },
    { id: "price",     label: "Moins chers" },
    { id: "available", label: "Disponibles" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col pb-24">

      {/* Header */}
      <header className="px-5 pt-6 pb-4 bg-[#F5F5F5] sticky top-0 z-40">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users size={14} className="text-orange-500" />
            <span>{sorted.length} pros près de vous</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
            <MapPin size={13} className="text-orange-500" />
            <span>San Pedro</span>
          </div>
        </div>
      </header>

      {/* Filtres */}
      <div className="w-full overflow-x-auto py-2 flex items-center gap-3 px-5 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setSort(f.id)}
            className={`flex-shrink-0 px-5 py-2.5 text-sm font-bold rounded-full shadow-sm transition-all ${
              sort === f.id
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="px-5 flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-3xl animate-pulse" />
          ))
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔧</div>
            <div className="font-bold text-gray-900 mb-2">
              {catFilter ? `Aucun spécialiste en ${catFilter}` : "Aucun réparateur disponible"}
            </div>
            <div className="text-sm text-gray-400 mb-6">
              De nouveaux réparateurs arrivent bientôt à San Pedro
            </div>
            <button
              onClick={() => navigate("/app/home")}
              className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl"
            >
              Retour à l'accueil
            </button>
          </div>
        ) : (
          sorted.map((r) => {
            const name = pickName(r as any);
            const specs = Array.isArray((r as any).specialties)
              ? (r as any).specialties.join(" • ")
              : (r as any).specialty ?? "Technicien";
            const isAvailable = (r as any).is_available;
            const trustColor = r.trust >= 80
              ? "bg-green-500"
              : r.trust >= 50
              ? "bg-amber-500"
              : "bg-red-500";

            return (
              <button
                key={r.id}
                onClick={() => navigate(`/app/reparateur/${r.id}`)}
                className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 text-left active:scale-[0.98] transition-all ${
                  !isAvailable ? "opacity-75" : ""
                }`}
              >
                {/* Avatar + Trust Badge */}
                <div className="relative shrink-0">
                  <div className={`w-20 h-20 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center font-black text-3xl ${
                    !isAvailable ? "grayscale" : ""
                  }`}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 px-2 py-1 ${trustColor} text-white text-[10px] font-black rounded-lg shadow-sm`}>
                    TRUST {r.trust}
                  </div>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-900 truncate">{name}</h3>
                    <div className="flex items-center gap-1 text-amber-500 shrink-0">
                      <Star size={13} className="fill-amber-400" />
                      <span className="text-xs font-bold text-gray-700">{r.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs font-medium mb-2 truncate">{specs}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <MapPin size={11} className="text-orange-500" />
                      <span>{r.distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                      <CreditCard size={11} className="text-orange-500" />
                      <span>Dès {formatFCFA(r.price)}</span>
                    </div>
                  </div>
                  {isAvailable && (
                    <span className="inline-block mt-2 text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">
                      ● Disponible maintenant
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}