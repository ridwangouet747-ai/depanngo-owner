import React from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";

export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="dg-card p-12 flex flex-col items-center justify-center text-gray-400">
      <Loader2 size={28} className="animate-spin text-brand-primary" />
      <div className="mt-3 text-sm">{label}</div>
    </div>
  );
}

export function ErrorBlock({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : String(error ?? "Erreur inconnue");
  return (
    <div className="dg-card p-8 border-l-4 border-l-brand-danger">
      <div className="flex items-start gap-3">
        <div className="dg-stat-icon bg-brand-danger-soft text-brand-danger">
          <AlertCircle size={20} />
        </div>
        <div>
          <h3 className="font-bold text-brand-dark">Impossible de charger les données</h3>
          <p className="text-sm text-gray-600 mt-1">{msg}</p>
          <p className="text-xs text-gray-400 mt-2">Vérifie que les policies RLS autorisent la lecture publique.</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyBlock({ label = "Aucune donnée pour l'instant" }: { label?: string }) {
  return (
    <div className="dg-card p-12 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
        <Inbox size={26} />
      </div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
    </div>
  );
}
