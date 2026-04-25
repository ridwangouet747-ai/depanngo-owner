import React, { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import {
  transactions, formatFCFA, COMMISSION_RATE, type TxStatus, type PaymentMethod,
} from "@/data/mock";
import { Avatar, PaymentBadge, StatusBadge } from "@/components/admin/Primitives";

const PAGE_SIZE = 10;

export default function Transactions() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | TxStatus>("all");
  const [pay, setPay] = useState<"all" | PaymentMethod>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (pay !== "all" && t.payment !== pay) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          t.client.toLowerCase().includes(s) ||
          t.service.toLowerCase().includes(s) ||
          t.quartier.toLowerCase().includes(s) ||
          t.id.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [q, status, pay]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalVolume = filtered.reduce((s, t) => s + t.montant, 0);
  const totalCommission = Math.round(totalVolume * COMMISSION_RATE);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="dg-card p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Rechercher client, service, quartier, ID…"
              className="dg-input"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}
              className="dg-input pl-9 pr-8 appearance-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Terminé</option>
              <option value="in_progress">En cours</option>
              <option value="dispute">Litige</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={pay}
              onChange={(e) => { setPay(e.target.value as typeof pay); setPage(1); }}
              className="dg-input pl-9 pr-8 appearance-none cursor-pointer"
            >
              <option value="all">Toutes méthodes</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN MoMo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-5 py-3 font-semibold">Transaction</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Réparateur</th>
                <th className="px-5 py-3 font-semibold">Quartier</th>
                <th className="px-5 py-3 font-semibold text-right">Montant</th>
                <th className="px-5 py-3 font-semibold text-right">Commission</th>
                <th className="px-5 py-3 font-semibold">Paiement</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((tx) => {
                const d = new Date(tx.date);
                return (
                  <tr key={tx.id} className="dg-table-row">
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-xs text-gray-500">{tx.id}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {d.toLocaleDateString("fr-FR")} · {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={tx.client} size={32} />
                        <span className="font-semibold text-brand-dark">{tx.client}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{tx.service}</td>
                    <td className="px-5 py-3.5 text-gray-600">{tx.reparateur}</td>
                    <td className="px-5 py-3.5 text-gray-600">{tx.quartier}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-brand-dark tabular-nums">
                      {formatFCFA(tx.montant)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-brand-primary tabular-nums">
                      +{formatFCFA(Math.round(tx.montant * COMMISSION_RATE))}
                    </td>
                    <td className="px-5 py-3.5"><PaymentBadge method={tx.payment} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                    Aucune transaction ne correspond aux filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-brand-dark">{filtered.length}</span> transactions ·{" "}
            Volume : <span className="font-semibold text-brand-dark tabular-nums">{formatFCFA(totalVolume)}</span> ·{" "}
            Commissions : <span className="font-semibold text-brand-primary tabular-nums">{formatFCFA(totalCommission)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-lg border border-border bg-white disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600">
              Page <span className="font-semibold text-brand-dark">{safePage}</span> / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-lg border border-border bg-white disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
