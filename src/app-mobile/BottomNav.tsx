import { NavLink } from "react-router-dom";
import { Home, Wrench, ListChecks, User } from "lucide-react";

const ITEMS = [
  { to: "/app/home",     icon: Home,       label: "Accueil" },
  { to: "/app/nouvelle-demande", icon: Wrench, label: "Demande" },
  { to: "/app/missions", icon: ListChecks, label: "Missions" },
  { to: "/app/profil",   icon: User,       label: "Profil" },
];

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-4 pb-4">
      <div className="glass-strong rounded-3xl px-2 py-2 flex items-center justify-around shadow-glass">
        {ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end>
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                isActive
                  ? "bg-brand-primary shadow-glow-sm"
                  : "hover:bg-glass-white"
              }`}>
                <Icon size={20} className={isActive ? "text-white" : "text-white/50"} />
                <span className={`text-[10px] font-semibold ${isActive ? "text-white" : "text-white/50"}`}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}