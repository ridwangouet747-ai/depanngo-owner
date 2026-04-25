import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { clients, formatFCFA } from "@/data/mock";
import { Avatar, Badge } from "@/components/admin/Primitives";

export default function Clients() {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      clients.filter((c) =>
        !q
          ? true
          : (c.nom + c.quartier + c.telephone).toLowerCase().includes(q.toLowerCase())
      ),
    [q]
  );

  const totalValue = filtered.reduce((s, c) => s + c.valeurTotale, 0);

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
                      <Avatar name={c.nom} size={36} />
                      <div>
                        <div className="font-semibold text-brand-dark">{c.nom}</div>
                        <div className="text-xs text-gray-500 font-mono">{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-700">{c.telephone}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c.quartier}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-brand-dark">{c.reparations}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="font-bold text-brand-dark tabular-nums">{formatFCFA(c.valeurTotale)}</div>
                    <div className="text-xs text-brand-primary font-semibold tabular-nums">+{formatFCFA(Math.round(c.valeurTotale * 0.07))}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.status === "actif" ? <Badge variant="success">Actif</Badge> : <Badge variant="neutral">Inactif</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-border bg-gray-50/50 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
          <div><span className="font-semibold text-brand-dark">{filtered.length}</span> clients</div>
          <div>Valeur totale : <span className="font-semibold text-brand-dark tabular-nums">{formatFCFA(totalValue)}</span></div>
          <div>Commissions générées : <span className="font-semibold text-brand-primary tabular-nums">{formatFCFA(Math.round(totalValue * 0.07))}</span></div>
        </div>
      </div>
    </div>
  );
}
