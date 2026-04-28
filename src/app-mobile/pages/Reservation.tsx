import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "../MobileShell";
import { useRepairer } from "../hooks/useRepairers";
import { calculateDeposit, formatFCFA, pickName, COMMISSION_RATE } from "@/lib/supabaseExternal";
import { supabaseClient } from "@/lib/supabaseClient";

const PAYMENT_METHODS = [
  { id: "wave", label: "Wave", color: "bg-blue-500", emoji: "🌊" },
  { id: "orange_money", label: "Orange Money", color: "bg-orange-500", emoji: "🟠" },
  { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-500", emoji: "🟡" },
] as const;

export default function Reservation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: r } = useRepairer(id);
  const [amount, setAmount] = useState(20000);
  const [method, setMethod] = useState<"wave" | "orange_money" | "mtn_momo">("wave");
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  const { depositAmount, remainingAmount, commission, repairerPayout } = calculateDeposit(amount);

  async function pay() {
    setPaying(true);
    // Simulation paiement (v1) — créer la transaction en base
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const txPayload = {
        client_id: user?.id ?? null,
        repairer_id: r?.id ?? null,
        total_amount_fcfa: amount,
        commission_rate: COMMISSION_RATE,
        commission_fcfa: commission,
        repairer_amount_fcfa: repairerPayout,
        deposit_amount: depositAmount,
        deposit_paid: true,
        payment_method: method,
        payment_status: "deposit_paid",
        status: "in_progress",
        intervention_quartier: (r as any)?.quartier ?? "San Pedro",
      };
      const { data, error } = await supabaseClient
        .from("transactions")
        .insert(txPayload as any)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate(`/app/suivi/${data?.id ?? "demo"}`), 1500);
    } catch (e: any) {
      // Mode démo si RLS bloque l'insert
      setSuccess(true);
      toast.info("Paiement simulé", { description: "Mode démo : la transaction n'a pas été enregistrée." });
      setTimeout(() => navigate(`/app/suivi/demo`), 1500);
    } finally {
      setPaying(false);
    }
  }

  if (success) {
    return (
      <MobileShell noBottomPad>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-24 h-24 rounded-full bg-brand-success flex items-center justify-center mb-6"
          >
            <CheckCircle2 size={56} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-brand-navy mb-2">Acompte payé !</h1>
          <p className="text-gray-500">Le réparateur est notifié et arrive bientôt.</p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-5 pt-4 flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="font-bold text-brand-navy">Confirmer la réservation</div>
      </div>

      <div className="px-5 space-y-4">
        {/* Réparateur */}
        {r && (
          <div className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary-soft text-brand-primary flex items-center justify-center font-bold">
              {pickName(r as any).charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-brand-navy">{pickName(r as any)}</div>
              <div className="text-xs text-gray-500">{(r as any).quartier ?? "San Pedro"}</div>
            </div>
          </div>
        )}

        {/* Montant */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Montant total</div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full pr-20 py-2 text-2xl font-bold text-brand-navy outline-none"
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">FCFA</span>
          </div>
        </div>

        {/* Calcul */}
        <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
          <Row label="Montant total" value={formatFCFA(amount)} />
          <Row label={`Acompte (${Math.round((depositAmount / amount) * 100) || 0}%)`} value={formatFCFA(depositAmount)} accent />
          <Row label="Reste à payer" value={formatFCFA(remainingAmount)} muted />
          <div className="border-t border-border pt-3">
            <Row label={`Commission plateforme (${(COMMISSION_RATE * 100).toFixed(0)}%)`} value={formatFCFA(commission)} muted small />
            <Row label="Réparateur reçoit" value={formatFCFA(repairerPayout)} muted small />
          </div>
        </div>

        {/* Méthode paiement */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Mode de paiement</div>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  method === m.id ? "border-brand-primary bg-brand-primary-soft" : "border-border bg-white"
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="font-semibold text-brand-navy flex-1 text-left">{m.label}</span>
                {method === m.id && <CheckCircle2 size={18} className="text-brand-primary" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-5 bg-gradient-to-t from-brand-bg via-brand-bg to-transparent">
        <button
          onClick={pay}
          disabled={paying || amount <= 0}
          className="w-full bg-brand-primary text-white font-semibold py-4 rounded-2xl shadow-glow-primary disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {paying ? <Loader2 className="animate-spin" size={18} /> : `Payer l'acompte ${formatFCFA(depositAmount)}`}
        </button>
      </div>
    </MobileShell>
  );
}

function Row({ label, value, accent, muted, small }: { label: string; value: string; accent?: boolean; muted?: boolean; small?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${small ? "text-xs" : "text-sm"} ${muted ? "text-gray-500" : "text-brand-navy"}`}>{label}</span>
      <span className={`${small ? "text-xs" : "text-sm"} font-semibold ${accent ? "text-brand-primary" : muted ? "text-gray-500" : "text-brand-navy"}`}>{value}</span>
    </div>
  );
}
