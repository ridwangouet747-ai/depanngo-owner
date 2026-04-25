import React, { useMemo } from "react";
import { Avatar, Badge, Stars } from "@/components/admin/Primitives";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "@/components/admin/States";
import { Eye, MapPin, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useRepairers, useTransactions } from "@/hooks/useDashboardData";
import { formatFCFA, pickName, COMMISSION_RATE } from "@/lib/supabaseExternal";

export default function Reparateurs() {
  const repQ = useRepairers();
  const txQ = useTransactions();

  if (repQ.isLoading) return <LoadingBlock label="Chargement des réparateurs…" />;
  if (repQ.error) return <ErrorBlock error={repQ.error} />;

  const list = repQ.data ?? [];
  const txs = txQ.data ?? [];

  if (list.length === 0) {
    return (
      <EmptyBlock label="Aucun réparateur enregistré pour l'instant. Ajoute des entrées dans la table 'repairers'." />
    );
  }

  return (
    <RepairersGrid list={list} txs={txs} />
  );
}

function RepairersGrid({ list, txs }: { list: any[]; txs: any[] }) {
  // Calcule revenus + count par réparateur depuis transactions
  const stats = useMemo(() => {
    const m = new Map<string, { revenue: number; count: number }>();
    for (const tx of txs) {
      if (!tx.repairer_id) continue;
      const s = m.get(tx.repairer_id) ?? { revenue: 0, count: 0 };
      s.revenue += Number(tx.total_amount_fcfa) || 0;
      s.count++;
      m.set(tx.repairer_id, s);
    }
    return m;
  }, [txs]);

  const handleToggle = (r: any) => {
    toast.info("Mise à jour non disponible", {
      description: "Active l'écriture dans la table repairers pour modifier le statut.",
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {list.map((r) => {
        const name = pickName(r);
        const s = stats.get(r.id) ?? { revenue: Number(r.total_revenue_fcfa) || 0, count: Number(r.repair_count) || 0 };
        const revenue = s.revenue || Number(r.total_revenue_fcfa) || 0;
        const count = s.count || Number(r.repair_count) || 0;
        const rating = Number(r.rating) || 0;
        const active = r.is_active !== false;
        const online = r.is_online === true;
        const specialty = (r.specialty as string) || (r.specialite as string) || "Réparateur";
        const quartier = (r.quartier as string) || "—";

        return (
          <div key={r.id} className="dg-card-hover p-5 flex flex-col">
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar name={name} size={52} />
                {online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brand-success ring-2 ring-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-brand-dark truncate">{name}</div>
                <Badge variant="primary">{specialty}</Badge>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <Stars value={rating} />
              <span className="text-sm font-semibold text-brand-dark tabular-nums">
                {rating > 0 ? rating.toFixed(1) : "—"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-gray-50 p-2.5">
                <div className="text-gray-500 flex items-center gap-1"><MapPin size={11} /> Quartier</div>
                <div className="font-semibold text-brand-dark mt-0.5 truncate">{quartier}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2.5">
                <div className="text-gray-500 flex items-center gap-1"><Wrench size={11} /> Réparations</div>
                <div className="font-semibold text-brand-dark mt-0.5 tabular-nums">{count}</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-brand-primary-soft p-3">
              <div className="text-[11px] text-gray-600 uppercase tracking-wider font-semibold">Revenus générés</div>
              <div className="text-lg font-bold text-brand-primary tabular-nums mt-0.5">
                {formatFCFA(revenue)}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Commission : <span className="font-semibold text-brand-dark">{formatFCFA(Math.round(revenue * COMMISSION_RATE))}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  onClick={() => handleToggle(r)}
                  className={
                    "relative rounded-full transition-colors " +
                    (active ? "bg-brand-success" : "bg-gray-300")
                  }
                  style={{ height: 22, width: 40 }}
                  aria-label="Toggle status"
                >
                  <span
                    className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform"
                    style={{ left: active ? 20 : 2 }}
                  />
                </button>
                <span className={"text-xs font-semibold " + (active ? "text-brand-success" : "text-gray-500")}>
                  {active ? "Actif" : "Suspendu"}
                </span>
              </label>
              <button
                onClick={() => toast.info("Profil réparateur", { description: name })}
                className="dg-btn-ghost text-brand-primary hover:bg-brand-primary-soft"
              >
                <Eye size={14} /> Profil
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
