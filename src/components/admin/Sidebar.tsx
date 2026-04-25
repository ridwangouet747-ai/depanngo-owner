import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CreditCard, Wrench, Users, AlertTriangle,
  Wallet, Map as MapIcon, LogOut, X
} from "lucide-react";
import { Avatar } from "./Primitives";
import { cn } from "@/lib/utils";
import { useDisputes } from "@/hooks/useDashboardData";

const NAV = [
  { to: "/", label: "Vue d'ensemble", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transactions", icon: CreditCard },
  { to: "/reparateurs", label: "Réparateurs", icon: Wrench },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/litiges", label: "Litiges", icon: AlertTriangle, dynamicBadge: "litiges" },
  { to: "/revenus", label: "Mes Revenus", icon: Wallet },
  { to: "/expansion", label: "Expansion", icon: MapIcon },
] as const;

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const litQ = useDisputes();
  const openCount = (litQ.data ?? []).filter(
    (d) => !d.status || d.status === "open" || d.status === "pending" || d.status === "in_review"
  ).length;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-brand-dark/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-72 bg-sidebar text-sidebar-foreground z-50 flex flex-col transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="px-6 pt-6 pb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-xl shadow-glow-primary">
                🔧
              </div>
              <div>
                <div className="font-bold text-lg tracking-tight">
                  DÉPANN<span className="text-brand-primary">'GO</span>
                </div>
                <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                  San Pedro · Admin
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-sidebar-accent"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] uppercase tracking-wider text-white/40 font-semibold">
            Pilotage
          </div>
          {NAV.map((item) => {
            const Icon = item.icon;
            const badge =
              "dynamicBadge" in item && item.dynamicBadge === "litiges"
                ? openCount
                : null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : undefined}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                    isActive
                      ? "bg-brand-primary text-white shadow-glow-primary"
                      : "text-white/70 hover:bg-sidebar-accent hover:text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={cn(isActive ? "text-white" : "text-white/60 group-hover:text-white")}
                    />
                    <span className="flex-1">{item.label}</span>
                    {badge && badge > 0 ? (
                      <span
                        className={cn(
                          "min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center",
                          isActive ? "bg-white text-brand-primary" : "bg-brand-danger text-white"
                        )}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="p-4 m-3 rounded-2xl bg-sidebar-accent/60 border border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar name="Adama Bamba" size={42} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">Adama Bamba</div>
              <div className="text-[11px] text-white/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-success" />
                Fondateur
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
