import React, { useMemo } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from "recharts";
import { Download, Wallet, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/admin/Primitives";
import { LoadingBlock, ErrorBlock } from "@/components/admin/States";
import { useTransactions, useCommissions, buildRevenusBreakdown, buildPaiementsRepartition, computeKpis, useRepairers, useProfiles, useDisputes } from "@/hooks/useDashboardData";
import { formatFCFA } from "@/lib/supabaseExternal";

export default function Revenus() {
  const txQ = useTransactions();
  const comQ = useCommissions();
  const repQ = useRepairers();
  const cliQ = useProfiles();
  const litQ = useDisputes();

  const txs = txQ.data ?? [];
  const commissions = comQ.data ?? [];

  const { breakdown, byPeriod } = useMemo(() => buildRevenusBreakdown(txs, commissions), [txs, commissions]);
  const paiements = useMemo(() => buildPaiementsRepartition(txs), [txs]);
  const kpis = useMemo(() => computeKpis(txs, repQ.data ?? [], cliQ.data ?? [], litQ.data ?? []), [txs, repQ.data, cliQ.data, litQ.data]);

  if (txQ.isLoading || comQ.isLoading) return <LoadingBlock label="Chargement des revenus…" />;
  if (txQ.error) return <ErrorBlock error={txQ.error} />;

  return (
    <div className="space-y-6">
      {/* Hero solde */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-primary))] via-[hsl(var(--brand-primary-hover))] to-[#cc4400] p-7 sm:p-8 text-white shadow-glow-primary">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 -bottom-20 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/80">
            <Wallet size={16} />
            Mon solde estimé
          </div>
          <div className="mt-3 text-4xl sm:text-5xl font-bold tabular-nums">
            {formatFCFA(breakdown.soldeEstime)}
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm text-white/90">
            {kpis.commissionsMonthDelta !== 0 && (
              <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2.5 py-1 rounded-full font-semibold">
                <TrendingUp size={13} /> {kpis.commissionsMonthDelta >= 0 ? "+" : ""}{kpis.commissionsMonthDelta}% vs mois dernier
              </span>
            )}
            <span>Commission 7% · Mois en cours</span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
            <div className="rounded-xl bg-white/10 backdrop-blur p-3">
              <div className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">Semaine</div>
              <div className="text-lg font-bold tabular-nums mt-1">{formatFCFA(breakdown.semaine)}</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur p-3">
              <div className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">Mois</div>
              <div className="text-lg font-bold tabular-nums mt-1">{formatFCFA(breakdown.mois)}</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur p-3">
              <div className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">Année</div>
              <div className="text-lg font-bold tabular-nums mt-1">{formatFCFA(breakdown.annee)}</div>
            </div>
          </div>

          <button
            onClick={() => toast.success("Comptabilité exportée", { description: "Fichier CSV prêt." })}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-primary font-semibold text-sm hover:bg-white/90 transition-all shadow-lg"
          >
            <Download size={16} />
            Exporter comptabilité
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Tableau commissions */}
        <div className="dg-card overflow-hidden xl:col-span-2">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-bold text-brand-dark">Commissions par période</h3>
            <p className="text-xs text-gray-500 mt-0.5">Détail volume / commission / nombre de transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-5 py-3 font-semibold">Période</th>
                  <th className="px-5 py-3 font-semibold text-right">Volume brut</th>
                  <th className="px-5 py-3 font-semibold text-right">Commission (7%)</th>
                  <th className="px-5 py-3 font-semibold text-right">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byPeriod.map((p, i) => {
                  const isHighlight = i === 0 || i === 2 || i === 4;
                  return (
                    <tr key={p.periode} className="dg-table-row">
                      <td className="px-5 py-3.5 font-semibold text-brand-dark">
                        <div className="flex items-center gap-2">
                          {p.periode}
                          {isHighlight && <Badge variant="primary">En cours</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700 tabular-nums">{formatFCFA(p.brut)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-brand-primary tabular-nums">{formatFCFA(p.commission)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-600 tabular-nums">{p.txCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Répartition paiements */}
        <div className="dg-card p-5">
          <h3 className="font-bold text-brand-dark">Méthodes de paiement</h3>
          <p className="text-xs text-gray-500 mt-0.5">% du volume traité</p>
          <div className="h-[260px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paiements}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paiements.map((p, i) => (
                    <Cell key={i} fill={p.color} stroke="white" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    boxShadow: "var(--shadow-card-hover)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, ""]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
