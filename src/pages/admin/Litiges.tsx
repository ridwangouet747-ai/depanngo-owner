import React, { useEffect, useMemo, useState } from "react";
import { Avatar, Badge } from "@/components/admin/Primitives";
import { LoadingBlock, ErrorBlock } from "@/components/admin/States";
import { Clock, CheckCircle2, RefreshCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useDisputes, useTransactions, useProfiles, useRepairers } from "@/hooks/useDashboardData";
import { formatFCFA, pickName } from "@/lib/supabaseExternal";

function useCountdown(targetIso: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return { expired: true, h: 0, m: 0, s: 0 };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { expired: false, h, m, s };
}

function CountdownBadge({ target }: { target: string }) {
  const { expired, h, m, s } = useCountdown(target);
  if (expired) return <Badge variant="danger" pulse>Délai dépassé</Badge>;
  const urgent = h < 6;
  return (
    <div
      className={
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums " +
        (urgent ? "bg-brand-danger-soft text-brand-danger" : "bg-brand-warning-soft text-[hsl(var(--brand-warning))]")
      }
    >
      <Clock size={12} />
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}

export default function Litiges() {
  const litQ = useDisputes();
  const txQ = useTransactions();
  const cliQ = useProfiles();
  const repQ = useRepairers();
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const raw = litQ.data ?? [];
  const txs = txQ.data ?? [];
  const clients = cliQ.data ?? [];
  const repairers = repQ.data ?? [];

  const list = useMemo(() => {
    return raw
      .filter(
        (d) => !hidden.has(d.id) &&
          (!d.status || d.status === "open" || d.status === "pending" || d.status === "in_review")
      )
      .map((d) => {
        const tx = txs.find((t) => t.id === d.transaction_id);
        const cli = clients.find((c) => c.id === d.client_id);
        const rep = repairers.find((r) => r.id === d.repairer_id);
        const opened = (d.opened_at as string) || (d.created_at as string) || new Date().toISOString();
        const deadline =
          (d.resolve_before as string) ||
          (d.deadline_at as string) ||
          new Date(new Date(opened).getTime() + 24 * 3_600_000).toISOString();
        const amount = Number(d.amount_fcfa) || Number(tx?.total_amount_fcfa) || 0;
        return {
          id: d.id,
          shortId: d.id.slice(0, 8),
          service: tx?.service_type ?? "Service",
          client: pickName(cli as never, d.client_id?.slice(0, 8) ?? "Client"),
          reparateur: pickName(rep as never, d.repairer_id?.slice(0, 8) ?? "Réparateur"),
          motif: (d.reason as string) || (d.motif as string) || "Aucun motif renseigné.",
          montant: amount,
          deadline,
        };
      });
  }, [raw, txs, clients, repairers, hidden]);

  const resolve = (id: string, side: "reparateur" | "client") => {
    const l = list.find((x) => x.id === id);
    setHidden((prev) => new Set(prev).add(id));
    toast.success(
      side === "reparateur" ? "Réparateur a eu raison" : "Client remboursé",
      { description: l ? `${l.shortId} · ${formatFCFA(l.montant)}` : undefined }
    );
  };

  if (litQ.isLoading) return <LoadingBlock label="Chargement des litiges…" />;
  if (litQ.error) return <ErrorBlock error={litQ.error} />;

  if (list.length === 0) {
    return (
      <div className="dg-card p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-success-soft flex items-center justify-center text-brand-success">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="mt-4 text-xl font-bold text-brand-dark">Tous les litiges sont résolus 🎉</h3>
        <p className="text-gray-500 mt-1">Bravo, ta plateforme tourne en confiance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="dg-card p-4 sm:p-5 border-l-4 border-l-brand-danger">
        <div className="flex items-start gap-3">
          <div className="dg-stat-icon bg-brand-danger-soft text-brand-danger">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-brand-dark">{list.length} litige{list.length > 1 ? "s" : ""} en attente d'arbitrage</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Chaque litige doit être résolu sous 24h. Statue rapidement pour préserver la confiance.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {list.map((l) => (
          <div
            key={l.id}
            className="dg-card overflow-hidden border-l-4 border-l-brand-danger bg-gradient-to-br from-brand-danger-soft/40 to-white"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500 font-mono">{l.shortId}</div>
                  <h3 className="font-bold text-brand-dark text-lg mt-0.5">{l.service}</h3>
                </div>
                <CountdownBadge target={l.deadline} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white border border-border p-3">
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Client</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Avatar name={l.client} size={32} />
                    <span className="font-semibold text-brand-dark text-sm truncate">{l.client}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-border p-3">
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Réparateur</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Avatar name={l.reparateur} size={32} />
                    <span className="font-semibold text-brand-dark text-sm truncate">{l.reparateur}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-white border border-border p-3">
                <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Montant en jeu</div>
                <div className="text-2xl font-bold text-brand-dark tabular-nums mt-1">{formatFCFA(l.montant)}</div>
              </div>

              <div className="mt-3 rounded-xl bg-white border border-border p-3">
                <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Motif</div>
                <p className="text-sm text-gray-700 leading-relaxed">{l.motif}</p>
              </div>
            </div>

            <div className="px-5 pb-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => resolve(l.id, "reparateur")}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-success text-white font-semibold text-sm hover:bg-brand-success/90 transition-all shadow-sm"
              >
                <CheckCircle2 size={16} />
                Réparateur a raison
              </button>
              <button
                onClick={() => resolve(l.id, "client")}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-danger text-white font-semibold text-sm hover:bg-brand-danger/90 transition-all shadow-sm"
              >
                <RefreshCcw size={16} />
                Rembourser client
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
