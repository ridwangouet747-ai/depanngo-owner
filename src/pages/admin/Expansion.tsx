import React, { useMemo } from "react";
import { MapPin, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/admin/Primitives";
import { LoadingBlock, ErrorBlock } from "@/components/admin/States";
import { useTransactions, useCities, buildByQuartier } from "@/hooks/useDashboardData";
import { formatFCFA } from "@/lib/supabaseExternal";

const NEXT_CITIES = [
  { ville: "Soubré", potentiel: "Élevé", distance: "85 km", population: "180k" },
  { ville: "Sassandra", potentiel: "Moyen", distance: "75 km", population: "55k" },
  { ville: "Tabou", potentiel: "Moyen", distance: "150 km", population: "65k" },
  { ville: "Méagui", potentiel: "Faible", distance: "120 km", population: "30k" },
];

export default function Expansion() {
  const txQ = useTransactions();
  const cityQ = useCities();

  const txs = txQ.data ?? [];
  const cities = cityQ.data ?? [];
  const activeCity = cities.find((c) => c.is_active) ?? cities[0];

  const byQuartier = useMemo(() => buildByQuartier(txs), [txs]);
  const max = Math.max(1, ...byQuartier.map((q) => q.volume));
  const distinctQuartiers = byQuartier.length;

  if (txQ.isLoading || cityQ.isLoading) return <LoadingBlock label="Chargement de l'expansion…" />;
  if (txQ.error) return <ErrorBlock error={txQ.error} />;

  return (
    <div className="space-y-6">
      <div className="dg-card p-5">
        <div className="flex items-start gap-3">
          <div className="dg-stat-icon bg-brand-primary-soft text-brand-primary">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-brand-dark">Pilote ta croissance</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {activeCity?.name ?? "San Pedro"} couvre actuellement{" "}
              <span className="font-semibold text-brand-dark">{distinctQuartiers} quartier{distinctQuartiers > 1 ? "s" : ""}</span>{" "}
              avec activité. Voici ta performance et les villes prioritaires pour étendre DÉPANN'GO en Côte d'Ivoire.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Quartiers actuels */}
        <div className="dg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-brand-dark">Performance par quartier</h3>
            <Badge variant="info">{activeCity?.name ?? "San Pedro"}</Badge>
          </div>
          {byQuartier.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Aucune transaction enregistrée pour l'instant.</p>
          ) : (
            <div className="space-y-3.5">
              {byQuartier.map((q) => (
                <div key={q.quartier}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="font-semibold text-sm text-brand-dark">{q.quartier}</span>
                    </div>
                    <div className="text-sm tabular-nums">
                      <span className="text-gray-500">{q.value} tx · </span>
                      <span className="font-semibold text-brand-dark">{formatFCFA(q.volume)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-primary to-[#ff8c33]"
                      style={{ width: `${(q.volume / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prochaines villes */}
        <div className="dg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-brand-dark">Villes cibles · Côte d'Ivoire</h3>
            <Badge variant="primary">Roadmap</Badge>
          </div>
          <div className="space-y-3">
            {NEXT_CITIES.map((c) => {
              const tone = c.potentiel === "Élevé" ? "success" : c.potentiel === "Moyen" ? "warning" : "neutral";
              return (
                <div key={c.ville} className="rounded-xl border border-border p-4 hover:border-brand-primary transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-brand-dark">{c.ville}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {c.distance} de San Pedro · {c.population} habitants
                      </div>
                    </div>
                    <Badge variant={tone as never}>
                      <TrendingUp size={11} /> Potentiel {c.potentiel}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
