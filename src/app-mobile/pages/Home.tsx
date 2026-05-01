import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Bell, Zap, Wrench, Wind, Smartphone, Monitor, Home as HomeIcon, ChevronRight, Star, Hammer, Paintbrush, Lock, Car, Building, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { MobileShell } from "../MobileShell";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRepairers } from "../hooks/useRepairers";
import { pickName } from "@/lib/supabaseExternal";

export const CATEGORIES = [
  { id: "electricite",    label: "Électricité",   icon: Zap,        color: "bg-yellow-500/20 text-yellow-400" },
  { id: "plomberie",      label: "Plomberie",      icon: Wrench,     color: "bg-blue-500/20 text-blue-400" },
  { id: "climatisation",  label: "Climatisation",  icon: Wind,       color: "bg-cyan-500/20 text-cyan-400" },
  { id: "telephonie",     label: "Téléphonie",     icon: Smartphone, color: "bg-purple-500/20 text-purple-400" },
  { id: "informatique",   label: "Informatique",   icon: Monitor,    color: "bg-indigo-500/20 text-indigo-400" },
  { id: "electromenager", label: "Électroménager", icon: HomeIcon,   color: "bg-pink-500/20 text-pink-400" },
  { id: "menuiserie",     label: "Menuiserie",     icon: Hammer,     color: "bg-amber-500/20 text-amber-400" },
  { id: "peinture",       label: "Peinture",       icon: Paintbrush, color: "bg-rose-500/20 text-rose-400" },
  { id: "serrurerie",     label: "Serrurerie",     icon: Lock,       color: "bg-gray-500/20 text-gray-400" },
  { id: "moto",           label: "Moto / Auto",    icon: Car,        color: "bg-orange-500/20 text-orange-400" },
  { id: "maconnerie",     label: "Maçonnerie",     icon: Building,   color: "bg-stone-500/20 text-stone-400" },
  { id: "jardinage",      label: "Jardinage",      icon: Leaf,       color: "bg-green-500/20 text-green-400" },
];

const NOTIFS = [
  { icon: "🔧", title: "Bienvenue sur Dépann'Go !", desc: "Trouvez un réparateur en moins de 60s", time: "À l'instant" },
  { icon: "⭐", title: "Nouveau réparateur disponible", desc: "Kouassi Hervé est disponible à Bardot", time: "Il y a 5 min" },
  { icon: "💰", title: "Offre spéciale", desc: "Réduction sur votre 1ère réparation", time: "Il y a 1h" },
];

export default function Home() {
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const { data: repairers, isLoading } = useRepairers();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <MobileShell>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-white/40 flex items-center gap-1">
              <MapPin size={12} />
              {position?.source === "gps" ? "Position actuelle" : "San Pedro, CI"}
            </div>
            <div className="font-black text-white text-xl mt-0.5">
              DÉPANN<span className="text-brand-primary">'GO</span>
            </div>
          </div>

          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-11 h-11 rounded-full glass flex items-center justify-center relative"
          >
            <Bell size={18} className="text-white" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          </button>

          {/* Panel notifications */}
          {showNotifs && (
            <div className="absolute top-16 right-0 left-0 glass-dark rounded-2xl shadow-glass z-50 overflow-hidden border border-white/10">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-bold text-white">Notifications</span>
                <button onClick={() => setShowNotifs(false)} className="text-xs text-white/40">Fermer</button>
              </div>
              {NOTIFS.map((n, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3 border-b border-white/5">
                  <span className="text-xl">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{n.title}</div>
                    <div className="text-xs text-white/50 mt-0.5">{n.desc}</div>
                    <div className="text-xs text-white/30 mt-1">{n.time}</div>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 text-center">
                <span className="text-xs text-brand-primary font-semibold">Voir toutes les notifications</span>
              </div>
            </div>
          )}
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Rechercher un service..."
            className="w-full pl-10 pr-4 py-3.5 glass border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-brand-primary"
            onChange={(e) => {
              const val = e.target.value.toLowerCase();
              if (val.length > 1) navigate(`/app/reparateurs?search=${val}`);
            }}
          />
        </div>
      </div>

      {/* Hero CTA */}
      <div className="px-5 mb-6">
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/app/nouvelle-demande")}
          className="rounded-3xl bg-gradient-to-br from-brand-primary via-orange-500 to-brand-primary-hover p-5 text-white shadow-glow-orange cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="text-xs uppercase tracking-widest opacity-70 font-bold">Nouveau</div>
          <div className="text-2xl font-black mt-1">Diagnostic IA gratuit</div>
          <div className="text-sm opacity-80 mt-1 mb-4">Décrivez votre panne, DEPA vous oriente.</div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-xs font-bold">
            Lancer DEPA <ChevronRight size={14} />
          </div>
        </motion.div>
      </div>

      {/* Catégories */}
      <div className="px-5 mb-6">
        <h2 className="font-black text-white mb-3">Catégories</h2>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/app/reparateurs?cat=${c.id}`)}
                className="flex flex-col items-center gap-2 p-3 glass border border-white/10 rounded-2xl transition-all hover:border-white/20"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-bold text-white/80 text-center leading-tight">
                  {c.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Réparateurs proches */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-white">Réparateurs proches</h2>
          <button
            onClick={() => navigate("/app/reparateurs")}
            className="text-xs text-brand-primary font-bold"
          >
            Voir tout →
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[180px] h-36 glass rounded-2xl animate-pulse shrink-0" />
            ))
          ) : (repairers ?? []).length === 0 ? (
            <div className="text-white/40 text-sm py-4">
              Aucun réparateur disponible pour le moment
            </div>
          ) : (
            (repairers ?? []).slice(0, 6).map((r) => {
              const name = pickName(r as any);
              const specs = Array.isArray((r as any).specialties)
                ? (r as any).specialties[0]
                : (r as any).specialty ?? "Technicien";
              const rating = Number((r as any).average_rating ?? 4.5);
              return (
                <motion.button
                  key={r.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/app/reparateur/${r.id}`)}
                  className="snap-start shrink-0 min-w-[180px] glass-card rounded-2xl p-4 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center font-black text-lg mb-3 border border-brand-primary/30">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="font-bold text-white text-sm truncate">{name}</div>
                  <div className="text-[11px] text-white/50 truncate mt-0.5">{specs}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
                    {(r as any).is_available && (
                      <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                        Dispo
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </MobileShell>
  );
}