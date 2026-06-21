import { NavLink } from "react-router-dom";
import { Home, ClipboardList, TrendingUp, User } from "lucide-react";

const ITEMS = [
  { to: "/app/pro/home",     icon: Home,          label: "Accueil"  },
  { to: "/app/pro/missions", icon: ClipboardList, label: "Missions" },
  { to: "/app/pro/revenus",  icon: TrendingUp,    label: "Revenus"  },
  { to: "/app/pro/profil",   icon: User,          label: "Profil"   },
];

export default function ProBottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 px-4 pb-4 pt-2 flex items-center justify-around z-50">
      {ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end>
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
              isActive ? "text-orange-500" : "text-gray-400"
            }`}>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? "text-orange-500" : "text-gray-400"}
              />
              <span className={`text-[10px] font-bold ${
                isActive ? "text-orange-500" : "text-gray-400"
              }`}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
