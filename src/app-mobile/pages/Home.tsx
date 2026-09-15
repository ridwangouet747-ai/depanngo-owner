import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, Bell, Zap, Droplets, Wind, Smartphone,
  Monitor, Microwave, Hammer, PaintBucket, Key, Bot, Star
} from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRepairers } from "../hooks/useRepairers";
import { useNotifications } from "../hooks/useNotifications";
import { useAuthClient } from "../hooks/useAuthClient";
import { pickName } from "@/lib/supabaseExternal";
import { HomeSkeleton } from "../components/Skeletons";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

const NOTIF_ICONS: Record<string, string> = {
  mission: "🔧",
  payment: "💰",
  review: "⭐",
  system: "📢",
  info: "ℹ️",
};

export const CATEGORIES = [
  { id: "electricite", label: "Électricité", icon: Zap, color: "bg-sky-100 text-sky-500" },
  { id: "plomberie", label: "Plomberie", icon: Droplets, color: "bg-green-100 text-green-500" },
  { id: "climatisation", label: "Climatisation", icon: Wind, color: "bg-slate-100 text-slate-500" },
  { id: "telephonie", label: "Téléphonie", icon: Smartphone, color: "bg-amber-100 text-orange-500" },
  { id: "informatique", label: "Informatique", icon: Monitor, color: "bg-slate-100 text-indigo-500" },
  { id: "electromenager", label: "Appareils", icon: Microwave, color: "bg-orange-50 text-pink-600" },
  { id: "menuiserie", label: "Menuiserie", icon: Hammer, color: "bg-orange-50 text-orange-500" },
  { id: "peinture", label: "Peinture", icon: PaintBucket, color: "bg-slate-100 text-purple-500" },
  { id: "serrurerie", label: "Serrurerie", icon: Key, color: "bg-teal-50 text-teal-600" },
];

export default function Home() {
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const { data: repairers, isLoading } = useRepairers();
  const { user } = useAuthClient();
  const { data: notifs = [] } = useNotifications(user?.id);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  if (isLoading) return <HomeSkeleton />;

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col relative overflow-x-hidden pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between bg-[#F5F5F5]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <MapPin size={12} className="text-orange-500" />
            <span>{position?.source === "gps" ? "Position actuelle" : "San Pedro, CI"}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Bonjour 👋</h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-11 h-11 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100"
          >
            <Bell size={20} className="text-gray-700" />
            {notifs.some((n) => !n.read_at) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </button>

          {/* Panel notifications */}
          {showNotifs && (
            <div className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-xl z-50 overflow-hidden border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-900">Notifications</span>
                <button onClick={() => setShowNotifs(false)} className="text-xs text-gray-400">Fermer</button>
              </div>
              {notifs.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucune notification</p>
                </div>
              ) : (
                notifs.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 flex items-start gap-3 border-b border-gray-50 hover:bg-gray-50 ${!n.read_at ? "bg-orange-50/30" : ""}`}
                  >
                    <span className="text-xl">{NOTIF_ICONS[n.type] ?? "ℹ️"}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{n.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{n.body}</div>
                      <div className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      {/* Barre de recherche */}
      <div className="px-5 mt-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchVal}
            placeholder="Rechercher un service..."
            className="w-full h-12 pl-11 pr-16 bg-white border-none rounded-xl shadow-sm text-sm outline-none focus:ring-2 focus:ring-orange-500 text-gray-700"
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchVal.trim().length > 0) {
                navigate(`/app/reparateurs?search=${searchVal.trim().toLowerCase()}`);
              }
            }}
          />
          {searchVal.length > 0 && (
            <button
              onClick={() => navigate(`/app/reparateurs?search=${searchVal.trim().toLowerCase()}`)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
            >
              OK
            </button>
          )}
        </div>
      </div>

      {/* Banner DEPA */}
      <div className="px-5 mt-6">
        <div
          className="bg-orange-500 p-5 rounded-3xl shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => navigate("/app/nouvelle-demande")}
        >
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute right-4 top-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div className="relative z-10">
            <span className="inline-block px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-bold text-white uppercase tracking-wider mb-2">
              Assistant IA
            </span>
            <h2 className="text-white text-xl font-bold leading-tight mb-1">
              Diagnostic IA gratuit
            </h2>
            <p className="text-white/80 text-sm mb-4 max-w-[200px]">
              Décrivez votre panne, DEPA vous oriente vers le bon pro.
            </p>
            <button className="h-10 px-5 bg-white text-orange-500 font-bold rounded-lg flex items-center gap-2 text-sm shadow-md active:scale-95 transition-transform">
              Lancer DEPA
              <Zap size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Catégories */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Nos Services</h3>
          <button
            onClick={() => navigate("/app/reparateurs")}
            className="text-orange-500 text-sm font-semibold"
          >
            Voir tout
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/app/reparateurs?cat=${c.id}`)}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className={`w-full aspect-square ${c.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <Icon size={28} />
                </div>
                <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Réparateurs proches */}
      <div className="px-5 mt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Réparateurs proches</h3>
          <button
            onClick={() => navigate("/app/reparateurs")}
            className="text-orange-500 text-sm font-semibold"
          >
            Voir tout
          </button>
        </div>
        <div className="space-y-3">
          {(repairers ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Aucun réparateur disponible pour le moment
            </div>
          ) : (
            (repairers ?? []).slice(0, 4).map((r) => {
              const name = pickName(r as any);
              const specs = Array.isArray((r as any).specialties)
                ? (r as any).specialties.join(" · ")
                : (r as any).specialty ?? "Technicien";
              const rating = (r as any).average_rating;
              const trust = (r as any).trust_score;
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(`/app/reparateur/${r.id}`)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center font-black text-xl shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 truncate">{name}</span>
                      {(r as any).is_available && (
                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{specs}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      {rating != null && (
                        <span className="flex items-center gap-1 font-bold text-gray-700">
                          <Star size={11} className="fill-orange-400 text-orange-400" />
                          {Number(rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {trust != null && (
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                      Number(trust) >= 80 ? "bg-green-100 text-green-600" :
                      Number(trust) >= 50 ? "bg-yellow-100 text-yellow-600" :
                      "bg-red-100 text-red-500"
                    }`}>
                      {trust}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
