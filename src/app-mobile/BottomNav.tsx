import { NavLink } from "react-router-dom";
import { Home, Wrench, ListChecks, User } from "lucide-react";

const ITEMS = [
  { to: "/app/home",             icon: Home,       label: "Accueil" },
  { to: "/app/nouvelle-demande", icon: Wrench,     label: "Demande" },
  { to: "/app/missions",         icon: ListChecks, label: "Missions" },
  { to: "/app/profil",           icon: User,       label: "Profil" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 px-6 pb-4 pt-2 flex items-center justify-between z-50">
      {ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end>
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
              isActive ? "text-orange-500" : "text-gray-400"
            }`}>
              <Icon
                size={24}
                className={isActive ? "text-orange-500" : "text-gray-400"}
                strokeWidth={isActive ? 2.5 : 1.8}
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