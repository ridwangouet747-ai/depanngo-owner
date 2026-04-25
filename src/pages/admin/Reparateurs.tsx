import React, { useState } from "react";
import { reparateurs as initial, formatFCFA } from "@/data/mock";
import { Avatar, Badge, Stars } from "@/components/admin/Primitives";
import { Eye, MapPin, Wrench } from "lucide-react";
import { toast } from "sonner";

export default function Reparateurs() {
  const [list, setList] = useState(initial);

  const toggle = (id: string) => {
    setList((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = !r.active;
        toast.success(next ? "Réparateur réactivé" : "Réparateur suspendu", {
          description: r.nom,
        });
        return { ...r, active: next, online: next && r.online };
      })
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {list.map((r) => (
        <div key={r.id} className="dg-card-hover p-5 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar name={r.nom} size={52} />
              {r.online && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brand-success ring-2 ring-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-brand-dark truncate">{r.nom}</div>
              <Badge variant="primary">{r.specialite}</Badge>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Stars value={r.rating} />
            <span className="text-sm font-semibold text-brand-dark tabular-nums">{r.rating.toFixed(1)}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-gray-50 p-2.5">
              <div className="text-gray-500 flex items-center gap-1"><MapPin size={11} /> Quartier</div>
              <div className="font-semibold text-brand-dark mt-0.5 truncate">{r.quartier}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5">
              <div className="text-gray-500 flex items-center gap-1"><Wrench size={11} /> Réparations</div>
              <div className="font-semibold text-brand-dark mt-0.5 tabular-nums">{r.reparations}</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-brand-primary-soft p-3">
            <div className="text-[11px] text-gray-600 uppercase tracking-wider font-semibold">Revenus générés</div>
            <div className="text-lg font-bold text-brand-primary tabular-nums mt-0.5">
              {formatFCFA(r.revenusGeneres)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Commission : <span className="font-semibold text-brand-dark">{formatFCFA(Math.round(r.revenusGeneres * 0.07))}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                onClick={() => toggle(r.id)}
                className={
                  "relative w-10 h-5.5 rounded-full transition-colors " +
                  (r.active ? "bg-brand-success" : "bg-gray-300")
                }
                style={{ height: 22, width: 40 }}
                aria-label="Toggle status"
              >
                <span
                  className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform"
                  style={{ left: r.active ? 20 : 2 }}
                />
              </button>
              <span className={"text-xs font-semibold " + (r.active ? "text-brand-success" : "text-gray-500")}>
                {r.active ? "Actif" : "Suspendu"}
              </span>
            </label>
            <button
              onClick={() => toast.info("Profil réparateur", { description: r.nom })}
              className="dg-btn-ghost text-brand-primary hover:bg-brand-primary-soft"
            >
              <Eye size={14} /> Profil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
