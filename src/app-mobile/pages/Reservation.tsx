import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Wrench, MapPin, User, Clock, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabaseExt, pickName } from "@/lib/supabaseExternal";
import { toast } from "sonner";

type PayMethod = "wave" | "orange" | "mtn";

const SERVICE_LABELS: Record<string, string> = {
  electricite: "Réparation Électricité",
  plomberie: "Réparation Plomberie",
  climatisation: "Réparation Climatisation",
  telephonie: "Réparation Téléphonie",
  informatique: "Réparation Informatique",
  electromenager: "Réparation Électroménager",
  menuiserie: "Travaux Menuiserie",
  peinture: "Travaux Peinture",
  serrurerie: "Réparation Serrurerie",
  moto: "Réparation Moto / Auto",
  maconnerie: "Travaux Maçonnerie",
  jardinage: "Entretien Jardinage",
};

const WAVE_LOGO = (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#1877F2" />
    <text x="24" y="32" fontSize="20" fontWeight="900"
      fill="white" textAnchor="middle" fontFamily="Arial">W</text>
    <path d="M10 30 Q18 22 24 30 Q30 38 38 30"
      stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

const OM_LOGO = (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#FF6600" />
    <circle cx="24" cy="24" r="14" fill="white" opacity="0.2" />
    <text x="24" y="29" fontSize="14" fontWeight="900"
      fill="white" textAnchor="middle" fontFamily="Arial">OM</text>
  </svg>
);

const MTN_LOGO = (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#FFCC00" />
    <text x="24" y="21" fontSize="11" fontWeight="900"
      fill="#1A1A2E" textAnchor="middle" fontFamily="Arial">MTN</text>
    <text x="24" y="34" fontSize="10" fontWeight="700"
      fill="#1A1A2E" textAnchor="middle" fontFamily="Arial">MoMo</text>
  </svg>
);

const PAYMENT_METHODS = [
  { id: "wave"   as PayMethod, label: "Wave",         sub: "Mobile Money", logo: WAVE_LOGO },
  { id: "orange" as PayMethod, label: "Orange Money", sub: "Mobile Money", logo: OM_LOGO   },
  { id: "mtn"    as PayMethod, label: "MTN MoMo",     sub: "Mobile Money", logo: MTN_LOGO  },
];

function calcDeposit(total: number) {
  const rate = total < 15000 ? 0.5 : total <= 50000 ? 0.4 : 0.3;
  const deposit = Math.round(total * rate);
  return { deposit, remaining: total - deposit, rate: Math.round(rate * 100) };
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function Reservation() {
  const { repairerId } = useParams<{ repairerId: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PayMethod | null>(null);
  const [loading, setLoading] = useState(false);

  // Récupère les infos depuis sessionStorage (diagnostic)
  const stored = JSON.parse(sessionStorage.getItem("dg-last-diagnostic") ?? "{}");
  const category: string = stored?.category ?? "service";
  const quartier: string = stored?.quartier ?? "San Pedro";
  const budgetRaw: number = Number(stored?.budget) || 25000;

  const { data: repairer } = useQuery({
    queryKey: ["repairer", repairerId],
    queryFn: async () => {
      if (!repairerId) return null;
      const { data } = await supabaseExt
        .from("repairers")
        .select("*, profiles(*)")
        .eq("id", repairerId)
        .single();
      return data;
    },
    enabled: !!repairerId,
  });

  const techName = repairer ? pickName(repairer as any) : "Technicien assigné";
  const serviceLabel = SERVICE_LABELS[category] ?? `Réparation ${category}`;
  const { deposit, remaining, rate } = calcDeposit(budgetRaw);

  async function handlePay() {
    if (!selected) {
      toast.error("Choisissez un moyen de paiement");
      return;
    }
    setLoading(true);
    try {
      // Simulation paiement MVP
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("Acompte payé avec succès !", {
        description: `${fmt(deposit)} via ${selected === "wave" ? "Wave" : selected === "orange" ? "Orange Money" : "MTN MoMo"}`,
      });
      navigate("/app/missions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col max-w-[430px] mx-auto pb-40">

      {/* Header */}
      <header className="flex items-center px-6 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="flex-1 text-center font-black text-lg text-gray-900 mr-10">
          Confirmer la réservation
        </h1>
      </header>

      <div className="px-6 space-y-4">

        {/* Card récapitulatif */}
        <div className="bg-white rounded-[22px] border border-gray-100 p-5 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <Wrench size={18} className="text-white" />
              </div>
              <span className="font-bold text-[15px] text-gray-900">{serviceLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <MapPin size={18} className="shrink-0" />
              <span className="font-semibold text-sm">Quartier {quartier}, San Pedro</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <User size={18} className="shrink-0" />
              <span className="font-semibold text-sm">Technicien : {techName}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Clock size={18} className="shrink-0" />
              <span className="font-semibold text-sm">Intervention dès aujourd'hui</span>
            </div>
          </div>
        </div>

        {/* Card calcul acompte */}
        <div className="bg-white rounded-[22px] border border-gray-100 p-5 shadow-sm">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-4">
            Détail du paiement
          </span>

          <div className="space-y-4">
            {/* Montant total */}
            <div className="flex justify-between items-center text-sm font-semibold text-gray-400">
              <span>Montant total estimé</span>
              <span className="text-gray-900 font-bold">{fmt(budgetRaw)}</span>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Acompte */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-semibold text-gray-400">Acompte ({rate}%)</span>
                <div className="mt-1.5 px-2 py-0.5 bg-orange-50 text-orange-500 text-[10px] font-black rounded-md inline-block uppercase tracking-tight">
                  À payer maintenant
                </div>
              </div>
              <span className="text-2xl font-black text-orange-500">{fmt(deposit)}</span>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Reste */}
            <div className="flex justify-between items-center text-sm font-semibold text-gray-300">
              <span>Reste après mission</span>
              <span>{fmt(remaining)}</span>
            </div>
          </div>

          {/* Note */}
          <div className="mt-5 flex gap-3 p-3 bg-gray-50 rounded-xl">
            <Info size={16} className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-gray-400 leading-tight">
              L'acompte garantit votre réservation et protège les deux parties.
            </p>
          </div>
        </div>

        {/* Moyen de paiement */}
        <h2 className="font-black text-sm text-gray-900 mt-2">
          Choisir votre moyen de paiement
        </h2>

        <div className="space-y-3">
          {PAYMENT_METHODS.map((m) => {
            const active = selected === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={`w-full border-2 rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98] text-left ${
                  active
                    ? "bg-orange-50 border-orange-500"
                    : "bg-white border-gray-200"
                }`}
              >
                {/* Logo */}
                <div className="w-12 h-12 shrink-0">{m.logo}</div>

                {/* Texte */}
                <div className="flex-1">
                  <p className="font-bold text-[15px] text-gray-900">{m.label}</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">{m.sub}</p>
                </div>

                {/* Radio */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  active ? "border-orange-500" : "border-gray-300"
                }`}>
                  {active && (
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bouton fixe en bas */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/80 backdrop-blur-md border-t border-gray-200 px-6 pt-4 pb-8 z-50">
        <button
          onClick={handlePay}
          disabled={!selected || loading}
          className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          style={{ boxShadow: selected ? "0 4px 20px rgba(232,89,12,0.3)" : "none" }}
        >
          {loading
            ? "Paiement en cours..."
            : `Payer l'acompte — ${fmt(deposit)}`}
        </button>
        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
          Paiement sécurisé • Remboursable
        </p>
      </div>
    </div>
  );
}