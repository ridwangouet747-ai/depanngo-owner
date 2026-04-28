import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, AlertTriangle, Wrench, Lightbulb, Banknote, Sparkles } from "lucide-react";
import { MobileShell } from "../MobileShell";
import { formatFCFA } from "@/lib/supabaseExternal";

interface DiagnosticData {
  diagnostic: string;
  category: string;
  description: string;
  urgency: "low" | "medium" | "high";
  quartier: string;
  budget: string;
}

const URGENCY_LABELS = {
  low: { label: "Faible", color: "text-brand-success bg-brand-success-soft" },
  medium: { label: "Moyenne", color: "text-brand-warning bg-brand-warning-soft" },
  high: { label: "Critique", color: "text-brand-danger bg-brand-danger-soft" },
};

export default function DiagnosticIA() {
  const navigate = useNavigate();
  const [data, setData] = useState<DiagnosticData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("dg-last-diagnostic");
    if (!raw) {
      navigate("/app/nouvelle-demande", { replace: true });
      return;
    }
    setData(JSON.parse(raw));
  }, [navigate]);

  if (!data) return null;

  const u = URGENCY_LABELS[data.urgency];
  const budgetN = Number(data.budget) || 0;
  const lo = budgetN ? Math.round(budgetN * 0.8) : 5000;
  const hi = budgetN ? Math.round(budgetN * 1.4) : 30000;

  return (
    <MobileShell>
      <div className="px-5 pt-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">DEPA</div>
          <div className="font-bold text-brand-navy">Diagnostic IA</div>
        </div>
        <Sparkles size={20} className="text-brand-primary" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-5 space-y-4">
        <div className="bg-gradient-to-br from-brand-navy to-brand-navy-soft text-white rounded-3xl p-5 shadow-card">
          <div className="text-[11px] uppercase tracking-wider opacity-70 font-semibold mb-1">Votre demande</div>
          <div className="font-semibold capitalize">{data.category} · {data.quartier}</div>
          <div className="text-sm opacity-80 mt-2 line-clamp-3">{data.description}</div>
        </div>

        <Section icon={Search} title="Diagnostic" color="text-brand-info bg-brand-info-soft">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{data.diagnostic}</p>
        </Section>

        <Section icon={AlertTriangle} title="Gravité" color="text-brand-warning bg-brand-warning-soft">
          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${u.color}`}>
            {u.label}
          </span>
        </Section>

        <Section icon={Wrench} title="Type de technicien" color="text-brand-primary bg-brand-primary-soft">
          <p className="text-sm text-gray-700 capitalize">Spécialiste {data.category}</p>
        </Section>

        <Section icon={Lightbulb} title="Conseils" color="text-brand-success bg-brand-success-soft">
          <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-4">
            <li>Coupez l'alimentation avant l'arrivée du technicien.</li>
            <li>Préparez l'accès et les pièces concernées.</li>
            <li>Conservez les preuves d'achat si garantie.</li>
          </ul>
        </Section>

        <Section icon={Banknote} title="Fourchette de prix" color="text-brand-navy bg-gray-100">
          <div className="text-lg font-bold text-brand-navy">
            {formatFCFA(lo)} – {formatFCFA(hi)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Estimation indicative. Le devis final dépend du diagnostic sur place.</div>
        </Section>
      </motion.div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-5 bg-gradient-to-t from-brand-bg via-brand-bg to-transparent">
        <button
          onClick={() => navigate("/app/reparateurs")}
          className="w-full bg-brand-primary text-white font-semibold py-4 rounded-2xl shadow-glow-primary active:scale-95 transition-all"
        >
          Trouver un réparateur maintenant
        </button>
      </div>
    </MobileShell>
  );
}

function Section({
  icon: Icon, title, color, children,
}: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        <div className="font-semibold text-brand-navy text-sm">{title}</div>
      </div>
      <div className="pl-12">{children}</div>
    </div>
  );
}
