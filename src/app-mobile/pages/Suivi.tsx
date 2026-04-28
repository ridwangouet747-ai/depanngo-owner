import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Check, Truck, Wrench, Flag, AlertTriangle } from "lucide-react";
import { MobileShell } from "../MobileShell";
import { supabaseClient } from "@/lib/supabaseClient";

const STEPS = [
  { id: "pending", label: "En attente", icon: Clock },
  { id: "accepted", label: "Acceptée", icon: Check },
  { id: "en_route", label: "En route", icon: Truck },
  { id: "in_progress", label: "En cours", icon: Wrench },
  { id: "completed", label: "Terminée", icon: Flag },
];

const STATUS_TO_INDEX: Record<string, number> = {
  pending: 0, accepted: 1, en_route: 2, in_progress: 3, completed: 4,
  // fallbacks
  dispute: 3,
};

export default function Suivi() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("accepted");

  useEffect(() => {
    if (!id || id === "demo") {
      // Simu progression
      let i = 1;
      const it = setInterval(() => {
        i = Math.min(i + 1, STEPS.length - 1);
        setStatus(STEPS[i].id);
        if (i >= STEPS.length - 1) clearInterval(it);
      }, 4000);
      return () => clearInterval(it);
    }
    let active = true;
    supabaseClient
      .from("transactions")
      .select("status")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.status) setStatus(String(data.status));
      });
    const ch = supabaseClient
      .channel(`tx-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions", filter: `id=eq.${id}` },
        (payload) => {
          const next = (payload.new as any)?.status;
          if (next) setStatus(String(next));
        })
      .subscribe();
    return () => {
      active = false;
      supabaseClient.removeChannel(ch);
    };
  }, [id]);

  const currentIdx = STATUS_TO_INDEX[status] ?? 0;

  return (
    <MobileShell>
      <div className="px-5 pt-4 flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/app/home")} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="text-xs text-gray-500">Mission</div>
          <div className="font-bold text-brand-navy">Suivi en temps réel</div>
        </div>
      </div>

      <div className="px-5">
        <div className="bg-gradient-to-br from-brand-navy to-brand-navy/80 text-white rounded-3xl p-5 mb-5">
          <div className="text-xs uppercase tracking-wider opacity-70 font-semibold">Statut actuel</div>
          <div className="text-2xl font-bold mt-1">{STEPS[currentIdx].label}</div>
          <div className="text-sm opacity-80 mt-1">Votre réparateur progresse, suivez l'avancement.</div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="space-y-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={s.id} className="flex items-start gap-4 relative">
                  {i < STEPS.length - 1 && (
                    <div className={`absolute left-[19px] top-10 w-0.5 h-10 ${done ? "bg-brand-success" : "bg-gray-200"}`} />
                  )}
                  <motion.div
                    animate={active ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: active ? Infinity : 0, duration: 1.6 }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${
                      done ? "bg-brand-success text-white"
                        : active ? "bg-brand-primary text-white shadow-glow-primary"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon size={18} />
                  </motion.div>
                  <div className="pt-2">
                    <div className={`font-semibold text-sm ${done || active ? "text-brand-navy" : "text-gray-400"}`}>
                      {s.label}
                    </div>
                    {active && <div className="text-xs text-brand-primary font-semibold mt-0.5">En cours…</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl border border-border bg-white text-brand-danger text-sm font-semibold">
          <AlertTriangle size={16} /> Signaler un problème
        </button>
      </div>
    </MobileShell>
  );
}
