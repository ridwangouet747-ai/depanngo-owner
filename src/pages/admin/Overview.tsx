import React, { useMemo } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Calendar,
  ShoppingBag, Star, Users, Wrench, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import { Avatar, Badge, PaymentBadge, StatusBadge } from "@/components/admin/Primitives";
import { LoadingBlock, ErrorBlock } from "@/components/admin/States";
import { useNavigate } from "react-router-dom";
import {
  useTransactions, useRepairers, useProfiles, useDisputes,
  computeKpis, buildCommissionsTrend, buildByQuartier,
} from "@/hooks/useDashboardData";
import { formatFCFA, pickName, COMMISSION_RATE } from "@/lib/supabaseExternal";

function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={
        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md " +
        (positive ? "text-brand-success bg-brand-success-soft" : "text-brand-danger bg-brand-danger-soft")
      }
    >
      <Icon size={12} />
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, deltaNode, iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  deltaNode?: React.ReactNode;
  iconColor: { bg: string; fg: string };
}) {
  return (
    <div className="dg-card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="dg-stat-icon" style={{ background: iconColor.bg, color: iconColor.fg }}>
          <Icon size={20} />
        </div>
        {deltaNode}
      </div>
      <div className="mt-4">
        <div className="text-[13px] text-gray-500 font-medium">{label}</div>
        <div className="mt-1 text-2xl sm:text-[28px] font-bold text-brand-dark tracking-tight tabular-nums">
          {value}
        </div>
        <div className="mt-1 text-xs text-gray-500">{sub}</div>
      </div>
    </div>
  );
}

const monthFr = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${monthFr[d.getMonth()]}`;
}

export default function Overview() {
  const navigate = useNavigate();
  const txQ = useTransactions();
  const repQ = useRepairers();
  const cliQ = useProfiles();
  const litQ = useDisputes();

  const isLoading = txQ.isLoading || repQ.isLoading || cliQ.isLoading || litQ.isLoading;
  const error = txQ.error || repQ.error || cliQ.error || litQ.error;

  const txs = txQ.data ?? [];
  const reps = repQ.data ?? [];
  const clients = cliQ.data ?? [];
  const disputes = litQ.data ?? [];

  const kpis = useMemo(() => computeKpis(txs, reps, clients, disputes), [txs, reps, clients, disputes]);
  const trend = useMemo(() => buildCommissionsTrend(txs), [txs]);
  const byQuartier = useMemo(() => buildByQuartier(txs).slice(0, 7), [txs]);
  const recent = useMemo(() => txs.slice(0, 5), [txs]);

  if (isLoading) return <LoadingBlock label="Chargement du tableau de bord…" />;
  if (error) return <ErrorBlock error={error} />;

  const trendCumul = trend.reduce((s, d) => s + d.commission, 0);

  return (
    <div className="space-y-6">
      {/* LIGNE 1 — KPI principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          icon={Wallet}
          label="Commissions aujourd'hui"
          value={formatFCFA(kpis.commissionsToday)}
          sub={`Sur ${kpis.txToday} transactions`}
          deltaNode={kpis.commissionsTodayDelta !== 0 ? <Delta value={kpis.commissionsTodayDelta} /> : undefined}
          iconColor={{ bg: "hsl(var(--brand-primary-soft))", fg: "hsl(var(--brand-primary))" }}
        />
        <KpiCard
          icon={Calendar}
          label="Commissions ce mois"
          value={formatFCFA(kpis.commissionsMonth)}
          sub="vs mois dernier"
          deltaNode={<Delta value={kpis.commissionsMonthDelta} />}
          iconColor={{ bg: "hsl(var(--brand-info-soft))", fg: "hsl(var(--brand-info))" }}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Transactions aujourd'hui"
          value={String(kpis.txToday)}
          sub="Volume cumulé"
          deltaNode={<Delta value={kpis.txTodayDelta} suffix=" vs hier" />}
          iconColor={{ bg: "hsl(var(--brand-success-soft))", fg: "hsl(var(--brand-success))" }}
        />
        <KpiCard
          icon={Star}
          label="Note moyenne plateforme"
          value={kpis.rating ? `${kpis.rating}/5` : "—"}
          sub={`${kpis.ratingTotal} réparateurs notés`}
          deltaNode={kpis.rating >= 4.5 ? <Badge variant="warning">★ Excellent</Badge> : undefined}
          iconColor={{ bg: "hsl(var(--brand-warning-soft))", fg: "hsl(var(--brand-warning))" }}
        />
      </div>

      {/* LIGNE 2 — Cartes secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="dg-card-hover p-5">
          <div className="flex items-start justify-between">
            <div className="dg-stat-icon" style={{ background: "hsl(var(--brand-info-soft))", color: "hsl(var(--brand-info))" }}>
              <Users size={20} />
            </div>
            {kpis.clientsToday > 0 && <Badge variant="info">+{kpis.clientsToday} aujourd'hui</Badge>}
          </div>
          <div className="mt-4 flex items-end gap-2">
            <div className="text-3xl font-bold text-brand-dark tabular-nums">{kpis.clientsTotal}</div>
            <div className="text-sm text-gray-500 mb-1">clients</div>
          </div>
          <div className="text-sm text-gray-600 mt-1">Inscrits sur la plateforme</div>
        </div>

        <div className="dg-card-hover p-5">
          <div className="flex items-start justify-between">
            <div className="dg-stat-icon" style={{ background: "hsl(var(--brand-primary-soft))", color: "hsl(var(--brand-primary))" }}>
              <Wrench size={20} />
            </div>
            <div className="dg-badge bg-brand-success-soft text-brand-success">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
              {kpis.reparateursOnline} en ligne
            </div>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <div className="text-3xl font-bold text-brand-dark tabular-nums">{kpis.reparateursActifs}</div>
            <div className="text-sm text-gray-500 mb-1">réparateurs actifs</div>
          </div>
          <div className="text-sm text-gray-600 mt-1">Disponibles pour intervention</div>
        </div>

        <div
          className="dg-card-hover p-5 border-brand-danger/30 bg-gradient-to-br from-brand-danger-soft to-white cursor-pointer"
          onClick={() => navigate("/litiges")}
        >
          <div className="flex items-start justify-between">
            <div
              className="dg-stat-icon pulse-ring rounded-xl"
              style={{ background: "hsl(var(--brand-danger))", color: "white" }}
            >
              <AlertTriangle size={20} />
            </div>
            {kpis.litigesOuverts > 0 && <Badge variant="danger" pulse>Action requise</Badge>}
          </div>
          <div className="mt-4 flex items-end gap-2">
            <div className="text-3xl font-bold text-brand-danger tabular-nums">{kpis.litigesOuverts}</div>
            <div className="text-sm text-gray-600 mb-1">litiges ouverts</div>
          </div>
          <div className="text-sm text-gray-700 mt-1 flex items-center gap-1">
            {kpis.litigesOuverts > 0 ? "Arbitrer maintenant" : "Tout est sous contrôle"}
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
        <div className="dg-card p-5 xl:col-span-2">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-brand-dark text-base">Commissions sur 30 jours</h3>
              <p className="text-xs text-gray-500 mt-0.5">7% sur chaque réparation · cumul {formatFCFA(trendCumul)}</p>
            </div>
            {kpis.commissionsMonthDelta !== 0 && (
              <Badge variant={kpis.commissionsMonthDelta >= 0 ? "success" : "danger"}>
                {kpis.commissionsMonthDelta >= 0 ? "+" : ""}{kpis.commissionsMonthDelta}% vs mois dernier
              </Badge>
            )}
          </div>
          <div className="h-[280px] mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--brand-primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--brand-primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--gray-200))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 11, fill: "hsl(var(--gray-500))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: "hsl(var(--gray-500))" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    boxShadow: "var(--shadow-card-hover)",
                    fontSize: 12,
                  }}
                  labelFormatter={(l) => shortDate(l as string)}
                  formatter={(v: number) => [formatFCFA(v), "Commission"]}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="hsl(var(--brand-primary))"
                  strokeWidth={2.5}
                  fill="url(#orangeGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dg-card p-5">
          <div>
            <h3 className="font-bold text-brand-dark text-base">Transactions par quartier</h3>
            <p className="text-xs text-gray-500 mt-0.5">Tous les temps</p>
          </div>
          <div className="h-[280px] mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byQuartier} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--gray-200))" vertical={false} />
                <XAxis
                  dataKey="quartier"
                  tick={{ fontSize: 10, fill: "hsl(var(--gray-500))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--gray-500))" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--brand-primary-soft))" }}
                  contentStyle={{
                    background: "white",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    boxShadow: "var(--shadow-card-hover)",
                    fontSize: 12,
                  }}
                  formatter={(v: number, _n, p) => [`${v} transactions · ${formatFCFA((p.payload as { volume: number }).volume)}`, "Volume"]}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {byQuartier.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "hsl(var(--brand-primary))" : "hsl(var(--brand-primary) / 0.55)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABLEAU DERNIÈRES TRANSACTIONS */}
      <div className="dg-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-border">
          <div>
            <h3 className="font-bold text-brand-dark text-base">Dernières transactions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Mis à jour en temps réel</p>
          </div>
          <button
            className="dg-btn-ghost text-brand-primary hover:bg-brand-primary-soft"
            onClick={() => navigate("/transactions")}
          >
            Voir tout <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Quartier</th>
                <th className="px-5 py-3 font-semibold text-right">Montant</th>
                <th className="px-5 py-3 font-semibold">Paiement</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Aucune transaction enregistrée pour l'instant.
                  </td>
                </tr>
              )}
              {recent.map((tx) => {
                const clientName = clients.find((c) => c.id === tx.client_id);
                const name = pickName(clientName as never, tx.client_id?.slice(0, 8) ?? "Client");
                const amount = Number(tx.total_amount_fcfa) || 0;
                return (
                  <tr key={tx.id} className="dg-table-row">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} size={36} />
                        <div>
                          <div className="font-semibold text-brand-dark">{name}</div>
                          <div className="text-xs text-gray-500 font-mono">{tx.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{tx.service_type ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{tx.intervention_quartier ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="font-bold text-brand-dark tabular-nums">{formatFCFA(amount)}</div>
                      <div className="text-xs text-brand-primary font-semibold tabular-nums">
                        +{formatFCFA(Math.round(amount * COMMISSION_RATE))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><PaymentBadge method={(tx.payment_method as never) ?? "wave"} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={(tx.status as never) ?? "in_progress"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
