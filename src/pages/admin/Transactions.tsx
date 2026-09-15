import React, { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Filter, Download, Calendar } from "lucide-react";
import { Avatar, PaymentBadge, StatusBadge } from "@/components/admin/Primitives";
import { LoadingBlock, ErrorBlock } from "@/components/admin/States";
import { useTransactions, useProfiles, useRepairers } from "@/hooks/useDashboardData";
import { formatFCFA, COMMISSION_RATE, pickName } from "@/lib/supabaseExternal";
import { exportTransactionsCSV, exportTransactionsExcel } from "@/lib/exportCSV";

const PAGE_SIZE = 10;

type DateRange = "all" | "today" | "week" | "month" | "quarter";

function getDateRange(range: DateRange): Date | null {
  const now = new Date();
  if (range === "all") return null;
  if (range === "today") {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (range === "week") {
    now.setDate(now.getDate() - 7);
    return now;
  }
  if (range === "month") {
    now.setMonth(now.getMonth() - 1);
    return now;
  }
  if (range === "quarter") {
    now.setMonth(now.getMonth() - 3);
    return now;
  }
  return null;
}

export default function Transactions() {
  const txQ = useTransactions();
  const cliQ = useProfiles();
  const repQ = useRepairers();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [pay, setPay] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [page, setPage] = useState(1);
  const [showExport, setShowExport] = useState(false);

  const txs = txQ.data ?? [];
  const clients = cliQ.data ?? [];
  const repairers = repQ.data ?? [];

  const enriched = useMemo(() => {
    return txs.map((t) => {
      const cli = clients.find((c) => c.id === t.client_id);
      const rep = repairers.find((r) => r.id === t.repairer_id);
      return {
        ...t,
        clientName: pickName(cli as never, t.client_id?.slice(0, 8) ?? "—"),
        repairerName: pickName(rep as never, t.repairer_id?.slice(0, 8) ?? "—"),
      };
    });
  }, [txs, clients, repairers]);

  const filtered = useMemo(() => {
    const minDate = getDateRange(dateRange);
    return enriched.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (pay !== "all" && t.payment_method !== pay) return false;
      if (minDate && new Date(t.created_at) < minDate) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          t.clientName.toLowerCase().includes(s) ||
          t.repairerName.toLowerCase().includes(s) ||
          (t.service_type ?? "").toLowerCase().includes(s) ||
          (t.intervention_quartier ?? "").toLowerCase().includes(s) ||
          t.id.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [enriched, q, status, pay, dateRange]);

  if (txQ.isLoading) return <LoadingBlock label="Chargement des transactions…" />;
  if (txQ.error) return <ErrorBlock error={txQ.error} />;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalVolume = filtered.reduce((s, t) => s + (Number(t.total_amount_fcfa) || 0), 0);
  const totalCommission = filtered.reduce(
    (s, t) => s + (Number(t.commission_fcfa) || Math.round((Number(t.total_amount_fcfa) || 0) * COMMISSION_RATE)),
    0
  );

  const exportRows = filtered.map((t) => ({
    id: t.id,
    created_at: t.created_at,
    clientName: t.clientName,
    repairerName: t.repairerName,
    service_type: t.service_type ?? "",
    intervention_quartier: t.intervention_quartier ?? "",
    total_amount_fcfa: Number(t.total_amount_fcfa) || 0,
    commission_fcfa: Number(t.commission_fcfa) || Math.round((Number(t.total_amount_fcfa) || 0) * COMMISSION_RATE),
    payment_method: t.payment_method ?? "",
    status: t.status ?? "",
  }));

  const DATE_RANGES: { id: DateRange; label: string }[] = [
    { id: "all", label: "Tout" },
    { id: "today", label: "Aujourd'hui" },
    { id: "week", label: "7 jours" },
    { id: "month", label: "30 jours" },
    { id: "quarter", label: "3 mois" },
  ];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="dg-card p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto,auto] gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Rechercher client, réparateur, service, quartier, ID…"
              className="dg-input"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="dg-input pl-9 pr-8 appearance-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Terminé</option>
              <option value="in_progress">En cours</option>
              <option value="pending">En attente</option>
              <option value="dispute">Litige</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={pay}
              onChange={(e) => { setPay(e.target.value); setPage(1); }}
              className="dg-input pl-9 pr-8 appearance-none cursor-pointer"
            >
              <option value="all">Toutes méthodes</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN MoMo</option>
              <option value="cash">Espèces</option>
            </select>
          </div>
          {/* Export button */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="dg-btn-outline flex items-center gap-2 h-full"
            >
              <Download size={14} />
              Exporter
            </button>
            {showExport && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]">
                <button
                  onClick={() => { exportTransactionsCSV(exportRows); setShowExport(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-green-600 font-mono text-xs">.csv</span>
                  Exporter CSV
                </button>
                <button
                  onClick={() => { exportTransactionsExcel(exportRows); setShowExport(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-blue-600 font-mono text-xs">.xls</span>
                  Exporter Excel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date range pills */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Calendar size={14} className="text-gray-400" />
          {DATE_RANGES.map((dr) => (
            <button
              key={dr.id}
              onClick={() => { setDateRange(dr.id); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                dateRange === dr.id
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {dr.label}
            </button>
          ))}
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
                <th className="px-5 py-3 font-semibold">Réparateur</th>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Quartier</th>
                <th className="px-5 py-3 font-semibold text-right">Montant</th>
                <th className="px-5 py-3 font-semibold text-right">Commission</th>
                <th className="px-5 py-3 font-semibold">Paiement</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((tx) => {
                const d = new Date(tx.created_at);
                const amount = Number(tx.total_amount_fcfa) || 0;
                const commission = Number(tx.commission_fcfa) || Math.round(amount * COMMISSION_RATE);
                return (
                  <tr key={tx.id} className="dg-table-row">
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-xs text-gray-500">{tx.id.slice(0, 8)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {d.toLocaleDateString("fr-FR")} · {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={tx.clientName} size={32} />
                        <span className="font-semibold text-brand-dark">{tx.clientName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={tx.repairerName} size={32} />
                        <span className="font-semibold text-gray-700">{tx.repairerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{tx.service_type ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{tx.intervention_quartier ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-brand-dark tabular-nums">
                      {formatFCFA(amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-brand-primary tabular-nums">
                      +{formatFCFA(commission)}
                    </td>
                    <td className="px-5 py-3.5"><PaymentBadge method={(tx.payment_method as never) ?? "wave"} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={(tx.status as never) ?? "in_progress"} /></td>
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
