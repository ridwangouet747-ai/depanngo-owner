import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Avatar, Badge } from "@/components/admin/Primitives";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "@/components/admin/States";
import { useProfiles, useTransactions } from "@/hooks/useDashboardData";
import { formatFCFA, pickName, COMMISSION_RATE } from "@/lib/supabaseExternal";

function maskPhone(p?: string | null) {
  if (!p) return "—";
  const digits = p.replace(/\D/g, "");
  if (digits.length < 6) return p;
  return digits.slice(0, 2) + " " + digits.slice(2, 4) + " ** ** " + digits.slice(-2);
}

export default function Clients() {
  const cliQ = useProfiles();
  const txQ = useTransactions();
  const [q, setQ] = useState("");

  const all = cliQ.data ?? [];
  const txs = txQ.data ?? [];

  // Calcul agrégé par client
  const stats = useMemo(() => {
    const m = new Map<string, { count: number; total: number }>();
    for (const tx of txs) {
      if (!tx.client_id) continue;
      const s = m.get(tx.client_id) ?? { count: 0, total: 0 };
      s.count++;
      s.total += Number(tx.total_amount_fcfa) || 0;
      m.set(tx.client_id, s);
    }
    return m;
  }, [txs]);

  const enriched = useMemo(
    () =>
      all.map((c) => {
        const s = stats.get(c.id) ?? {
          count: Number(c.repair_count) || 0,
          total: Number(c.total_value_fcfa) || 0,
        };
        return {
          ...c,
          _name: pickName(c),
          _phone: (c.phone as string) ?? null,
          _quartier: (c.quartier as string) ?? "—",
          _count: s.count,
          _total: s.total,
          _status: (c.status as string) || (s.count > 0 ? "actif" : "inactif"),
        };
      }),
    [all, stats]
  );

  const filtered = useMemo(
    () =>
      enriched.filter((c) =>
        !q
          ? true
          : (c._name + " " + c._quartier + " " + (c._phone ?? "")).toLowerCase().includes(q.toLowerCase())
      ),
    [enriched, q]
  );

  if (cliQ.isLoading) return <LoadingBlock label="Chargement des clients…" />;
  if (cliQ.error) return <ErrorBlock error={cliQ.error} />;

  if (all.length === 0) {
    return <EmptyBlock label="Aucun client enregistré pour l'instant. Ajoute des profils dans la table 'profiles'." />;
  }

  const totalValue = filtered.reduce((s, c) => s + c._total, 0);

  return (
    <div className="space-y-5">
      <div className="dg-card p-4 sm:p-5">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un client…"
            className="dg-input"
          />
        </div>
      </div>

      <div className="dg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Téléphone</th>
                <th className="px-5 py-3 font-semibold">Quartier</th>
                <th className="px-5 py-3 font-semibold text-right">Réparations</th>
                <th className="px-5 py-3 font-semibold text-right">Valeur générée</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="dg-table-row">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={c._name} size={36} />
                      <div>
                        <div className="font-semibold text-brand-dark">{c._name}</div>
                        <div className="text-xs text-gray-500 font-mono">{c.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-700">{maskPhone(c._phone)}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c._quartier}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-brand-dark">{c._count}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="font-bold text-brand-dark tabular-nums">{formatFCFA(c._total)}</div>
                    <div className="text-xs text-brand-primary font-semibold tabular-nums">
                      +{formatFCFA(Math.round(c._total * COMMISSION_RATE))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {c._status === "actif" ? <Badge variant="success">Actif</Badge> : <Badge variant="neutral">Inactif</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-border bg-gray-50/50 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
          <div><span className="font-semibold text-brand-dark">{filtered.length}</span> clients</div>
          <div>Valeur totale : <span className="font-semibold text-brand-dark tabular-nums">{formatFCFA(totalValue)}</span></div>
          <div>Commissions générées : <span className="font-semibold text-brand-primary tabular-nums">{formatFCFA(Math.round(totalValue * COMMISSION_RATE))}</span></div>
        </div>
      </div>
    </div>
  );
}
