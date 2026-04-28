import { useNavigate } from "react-router-dom";
import { Search, MapPin, Bell, Zap, Wrench, Wind, Smartphone, Monitor, Home as HomeIcon, ChevronRight, Star, Hammer, Paintbrush, Lock, Car, Building, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { MobileShell } from "../MobileShell";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRepairers } from "../hooks/useRepairers";
import { useAuthClient } from "../hooks/useAuthClient";
import { pickName, formatFCFA } from "@/lib/supabaseExternal";

export const CATEGORIES = [
  { id: "electricite",   label: "Électricité",    icon: Zap,        color: "bg-yellow-100 text-yellow-600" },
  { id: "plomberie",     label: "Plomberie",       icon: Wrench,     color: "bg-blue-100 text-blue-600" },
  { id: "climatisation", label: "Climatisation",   icon: Wind,       color: "bg-cyan-100 text-cyan-600" },
  { id: "telephonie",    label: "Téléphonie",      icon: Smartphone, color: "bg-purple-100 text-purple-600" },
  { id: "informatique",  label: "Informatique",    icon: Monitor,    color: "bg-indigo-100 text-indigo-600" },
{ id: "electromenager", label: "Électroménager", icon: HomeIcon, color: "bg-pink-100 text-pink-600" },
  { id: "menuiserie",    label: "Menuiserie",      icon: Hammer,     color: "bg-amber-100 text-amber-600" },
  { id: "peinture",      label: "Peinture",        icon: Paintbrush, color: "bg-rose-100 text-rose-600" },
  { id: "serrurerie",    label: "Serrurerie",      icon: Lock,       color: "bg-gray-100 text-gray-600" },
  { id: "moto",          label: "Moto / Auto",     icon: Car,        color: "bg-orange-100 text-orange-600" },
  { id: "maconnerie",    label: "Maçonnerie",      icon: Building,   color: "bg-stone-100 text-stone-600" },
  { id: "jardinage",     label: "Jardinage",       icon: Leaf,       color: "bg-green-100 text-green-600" },
];

export default function Home() {
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const { user } = useAuthClient();
  const { data: repairers, isLoading } = useRepairers();

  return (
    <MobileShell>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={12} /> {position?.source === "gps" ? "Position actuelle" : "San Pedro"}
            </div>
            <div className="font-bold text-brand-navy text-lg">
              Bonjour 👋
            </div>
          </div>
          <button className="w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center relative">
            <Bell size={18} className="text-brand-navy" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-primary" />
          </button>
        </div>

       <div className="relative">
  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
  <input
    type="text"
    placeholder="Rechercher un service..."
    className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl shadow-card text-sm outline-none focus:ring-2 focus:ring-brand-primary"
    onChange={(e) => {
      const val = e.target.value.toLowerCase();
      if (val.length > 1) navigate(`/app/reparateurs?search=${val}`);
    }}
  />
</div>

      {/* Hero CTA */}
      <div className="px-5 mb-6">
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/app/nouvelle-demande")}
          className="rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primary-hover p-5 text-white shadow-glow-primary cursor-pointer"
        >
          <div className="text-xs uppercase tracking-wider opacity-80 font-semibold">Nouveau</div>
          <div className="text-xl font-bold mt-1">Diagnostic IA gratuit</div>
          <div className="text-sm opacity-90 mt-1 mb-4">Décrivez votre panne, on vous oriente.</div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold">
            Lancer DEPA <ChevronRight size={14} />
          </div>
        </motion.div>
      </div>

      {/* Categories */}
      <div className="px-5 mb-6">
        <h2 className="font-bold text-brand-navy mb-3">Catégories</h2>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/app/nouvelle-demande?cat=${c.id}`)}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-card active:scale-95 transition-transform"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.color}`}>
                  <Icon size={22} />
                </div>
                <span className="text-[11px] font-semibold text-brand-navy text-center leading-tight">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Réparateurs proches */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-brand-navy">Réparateurs proches</h2>
          <button onClick={() => navigate("/app/reparateurs")} className="text-xs text-brand-primary font-semibold">
            Voir tout
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[200px] h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))
          ) : (repairers ?? []).slice(0, 6).map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/app/reparateur/${r.id}`)}
              className="snap-start min-w-[200px] bg-white rounded-2xl p-4 shadow-card text-left active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-brand-primary-soft text-brand-primary flex items-center justify-center font-bold text-lg mb-2">
                {pickName(r as any).charAt(0)}
              </div>
              <div className="font-semibold text-sm text-brand-navy truncate">{pickName(r as any)}</div>
              <div className="text-[11px] text-gray-500 truncate">{(r as any).specialty || (Array.isArray((r as any).specialties) ? (r as any).specialties[0] : "Technicien")}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-xs">
                  <Star size={12} className="fill-brand-warning text-brand-warning" />
                  <span className="font-semibold">{Number((r as any).average_rating ?? r.rating ?? 4.5).toFixed(1)}</span>
                </div>
                {(r as any).is_available || r.is_online ? (
                  <span className="text-[10px] bg-brand-success-soft text-brand-success px-1.5 py-0.5 rounded-full font-semibold">● Dispo</span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
