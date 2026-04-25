import React, { useEffect, useState } from "react";
import { Megaphone, Download, Menu } from "lucide-react";

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/": { title: "Vue d'ensemble", sub: "Tout ce qui se passe sur DÉPANN'GO en temps réel" },
  "/transactions": { title: "Transactions", sub: "Toutes les opérations validées sur la plateforme" },
  "/reparateurs": { title: "Réparateurs", sub: "Pilotage des techniciens partenaires" },
  "/clients": { title: "Clients", sub: "Base utilisateurs et historique des commandes" },
  "/litiges": { title: "Litiges", sub: "Conflits à arbitrer rapidement" },
  "/revenus": { title: "Mes Revenus", sub: "Commissions, paiements et exports comptables" },
  "/expansion": { title: "Expansion", sub: "Pilote la croissance par quartier" },
};

export function Header({
  pathname,
  onMenuClick,
  onExport,
  onPushMessage,
}: {
  pathname: string;
  onMenuClick: () => void;
  onExport?: () => void;
  onPushMessage?: () => void;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const meta = PAGE_TITLES[pathname] ?? PAGE_TITLES["/"];
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Africa/Abidjan",
  });

  return (
    <header className="sticky top-0 z-30 bg-brand-bg/80 backdrop-blur-md border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight truncate">
            {meta.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
            <span className="capitalize">{dateStr}</span> · {timeStr} (San Pedro)
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2.5">
          <div className="dg-badge bg-brand-success-soft text-brand-success">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
            Système opérationnel
          </div>
          <button onClick={onExport} className="dg-btn-dark hidden sm:inline-flex">
            <Download size={16} />
            Export CSV
          </button>
          <button onClick={onPushMessage} className="dg-btn-primary">
            <Megaphone size={16} />
            <span className="hidden sm:inline">Message Push</span>
          </button>
        </div>

        <button
          onClick={onPushMessage}
          className="md:hidden p-2.5 rounded-xl bg-brand-primary text-white shadow-glow-primary"
          aria-label="Message push"
        >
          <Megaphone size={18} />
        </button>
      </div>
    </header>
  );
}
