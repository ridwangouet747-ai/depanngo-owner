import { NavLink, useLocation } from "react-router-dom";
import { Home, ListChecks, Wrench, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/app/home", icon: Home, label: "Accueil" },
  { to: "/app/nouvelle-demande", icon: Wrench, label: "Demande" },
  { to: "/app/missions", icon: ListChecks, label: "Missions" },
  { to: "/app/profil", icon: User, label: "Profil" },
];

export function BottomNav() {
  const { pathname } = useLocation();
  // Hide on auth/onboarding
  if (pathname.startsWith("/app/auth") || pathname.startsWith("/app/onboarding")) return null;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 dg-glass border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-brand-primary" : "text-gray-500"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
