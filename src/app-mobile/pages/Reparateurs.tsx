import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

        // Filtre par catégorie
        if (catFilter) {
          const match = specs.some((s: string) =>
            s.toLowerCase().includes(catFilter.toLowerCase())
          );
          if (!match) return false;
        }

        // Filtre par recherche texte
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
    return arr;
  }, [enriched, sort]);

  const pageTitle = catFilter
    ? `Spécialistes ${catFilter}`
    : searchFilter
    ? `Résultats : "${searchFilter}"`
    : "Réparateurs disponibles";

  return (
    <MobileShell>
      {/* Header */}
      <div className="px-5 pt-4 flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1">
          <div className="font-bold text-white">{pageTitle}</div>
          <div className="text-xs text-white/50">
            {sorted.length} pro{sorted.length > 1 ? "s" : ""} près de vous
          </div>
        </div>
      </div>

      {/* Carte statique */}
      <div className="px-5 mb-4">
        <div className="rounded-2xl overflow-hidden border border-white/10 h-40 glass flex items-center justify-center">
          <div className="text-center">
            <Map size={28} className="text-brand-primary mx-auto mb-2" />
            <div className="text-sm font-semibold text-white">San Pedro, Côte d'Ivoire</div>
            <div className="text-xs text-white/50">{sorted.length} réparateurs dans votre zone</div>
          </div>
        </div>
      </div>

      {/* Filtres tri */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={14} className="text-white/30 shrink-0" />
          {(["distance", "rating", "price"] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                sort === s
                  ? "bg-brand-primary text-white shadow-glow-sm"
                  : "glass border border-white/10 text-white/60"
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
            <div key={i} className="h-24 glass rounded-2xl animate-pulse" />
          ))
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔧</div>
            <div className="font-bold text-white mb-2">
              {catFilter
                ? `Aucun spécialiste en ${catFilter} disponible`
                : "Aucun réparateur disponible"}
            </div>
            <div className="text-sm text-white/50 mb-6">
              De nouveaux réparateurs arrivent bientôt à San Pedro
            </div>
            <button
              onClick={() => navigate("/app/home")}
              className="btn-primary px-6 py-3 text-sm"
            >
              Retour à l'accueil
            </button>
          </div>
        ) : (
          sorted.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/app/reparateur/${r.id}`)}
              className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
            >
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 text-brand-primary flex items-center justify-center font-black text-xl shrink-0 border border-brand-primary/30">
                {pickName(r as any).charAt(0)}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-white truncate">{pickName(r as any)}</div>
                  {(r as any).is_available && (
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  )}
                </div>
                <div className="text-xs text-white/50 truncate mt-0.5">
                  {Array.isArray((r as any).specialties)
                    ? (r as any).specialties.join(", ")
                    : (r as any).specialty ?? "Technicien"}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1 font-bold text-white">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    {r.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1 text-white/40">
                    <MapPin size={10} /> {r.distance.toFixed(1)} km
                  </span>
                  <span className="text-brand-primary font-bold">
                    dès {formatFCFA(r.price)}
                  </span>
                </div>
              </div>

              {/* Trust Score */}
              <div className={`px-2.5 py-1.5 rounded-xl text-xs font-black ${
                r.trust >= 80
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : r.trust >= 50
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
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