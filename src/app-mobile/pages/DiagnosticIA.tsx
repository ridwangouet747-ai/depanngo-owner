import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, AlertTriangle, Wrench,
  Lightbulb, CreditCard, ChevronRight
} from "lucide-react";

type Severity = "faible" | "moyen" | "critique";

const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; border: string; text: string; dot: string }> = {
  faible:   { label: "Faible",   bg: "bg-green-50",  border: "border-green-400",  text: "text-green-800",  dot: "bg-green-700" },
  moyen:    { label: "Moyen",    bg: "bg-amber-50",  border: "border-amber-400",  text: "text-amber-800",  dot: "bg-amber-700" },
  critique: { label: "Critique", bg: "bg-red-50",    border: "border-red-400",    text: "text-red-800",    dot: "bg-red-700"   },
};

function parseDiagnostic(raw: string) {
  const get = (label: string) => {
    const regex = new RegExp(`${label}[^→]*→\\s*([^\\n]+(?:\\n(?![🔍⚠️🔧💡💰]).*)*)`);
    const match = raw.match(regex);
    return match ? match[1].trim() : null;
  };

  const probableRaw  = get("🔍 DIAGNOSTIC PROBABLE") ?? get("DIAGNOSTIC PROBABLE") ?? raw;
  const graviteRaw   = get("⚠️ NIVEAU DE GRAVITÉ")   ?? get("GRAVITÉ")              ?? "moyen";
  const technicien   = get("🔧 TYPE DE TECHNICIEN REQUIS") ?? get("TECHNICIEN")     ?? "Technicien spécialisé";
  const conseilsRaw  = get("💡 CE QUE TU PEUX FAIRE EN ATTENDANT") ?? get("CONSEILS") ?? "";
  const prixRaw      = get("💰 FOURCHETTE DE PRIX ESTIMÉE") ?? get("PRIX")           ?? "5 000 — 25 000 FCFA";

  const severity: Severity =
    graviteRaw.toLowerCase().includes("critique") ? "critique" :
    graviteRaw.toLowerCase().includes("faible")   ? "faible"   : "moyen";

  const conseils = conseilsRaw
    .split("\n")
    .map((l) => l.replace(/^→\s*/, "").replace(/^▸\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const prix = prixRaw.includes("FCFA") ? prixRaw : `${prixRaw} FCFA`;

  return { probable: probableRaw, severity, technicien, conseils, prix };
}

export default function DiagnosticResult() {
  const navigate = useNavigate();

  // Récupère le diagnostic depuis sessionStorage
  const raw = sessionStorage.getItem("dg-last-diagnostic");
  const stored = raw ? JSON.parse(raw) : null;
  const diagnosticText: string = stored?.diagnostic ?? "";
  const category: string = stored?.category ?? "service";

  const { probable, severity, technicien, conseils, prix } = parseDiagnostic(diagnosticText);
  const sevCfg = SEVERITY_CONFIG[severity];

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col max-w-[430px] mx-auto pb-32">

      {/* Header */}
      <header className="flex items-center px-6 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="flex-1 text-center font-black text-lg text-gray-900 mr-10">
          Diagnostic DEPA
        </h1>
      </header>

      <div className="px-6 flex-1">

        {/* Badge IA */}
        <div className="flex justify-center mb-6">
          <div className="px-4 py-2 bg-orange-50 border border-orange-500 rounded-full flex items-center gap-2">
            <span className="text-xs text-orange-500 font-black uppercase tracking-wider">
              ✦ Analyse par Intelligence Artificielle
            </span>
          </div>
        </div>

        {/* Card principale */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-md overflow-hidden">

          {/* Section 1 — Diagnostic probable */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <Search size={14} className="text-orange-500" />
              </div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                Diagnostic Probable
              </span>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-gray-700">
              {probable}
            </p>
          </div>

          <div className="h-px bg-gray-100 mx-6" />

          {/* Section 2 — Gravité */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle size={14} className="text-orange-500" />
              </div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                Gravité
              </span>
            </div>
            <div className={`w-full py-3 ${sevCfg.bg} border ${sevCfg.border} rounded-xl flex items-center justify-center gap-2`}>
              <div className={`w-2 h-2 ${sevCfg.dot} rounded-full animate-pulse`} />
              <span className={`${sevCfg.text} font-black text-xs uppercase tracking-widest`}>
                {sevCfg.label}
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-6" />

          {/* Section 3 — Technicien */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <Wrench size={14} className="text-orange-500" />
              </div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                Technicien
              </span>
            </div>
            <div className="inline-flex px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-900 capitalize">
              {technicien}
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-6" />

          {/* Section 4 — Conseils */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <Lightbulb size={14} className="text-orange-500" />
              </div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                Conseils
              </span>
            </div>
            <ul className="space-y-2">
              {conseils.length > 0 ? conseils.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] font-semibold text-gray-500">
                  <span className="text-orange-500 mt-0.5 shrink-0">▸</span>
                  {c}
                </li>
              )) : (
                <>
                  <li className="flex items-start gap-2 text-[13px] font-semibold text-gray-500">
                    <span className="text-orange-500 mt-0.5">▸</span>
                    Sécurisez la zone autour de la panne
                  </li>
                  <li className="flex items-start gap-2 text-[13px] font-semibold text-gray-500">
                    <span className="text-orange-500 mt-0.5">▸</span>
                    Prenez des photos du problème
                  </li>
                  <li className="flex items-start gap-2 text-[13px] font-semibold text-gray-500">
                    <span className="text-orange-500 mt-0.5">▸</span>
                    Notez depuis quand le problème a commencé
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="h-px bg-gray-100 mx-6" />

          {/* Section 5 — Prix */}
          <div className="p-6 bg-orange-50/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <CreditCard size={14} className="text-orange-500" />
              </div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                Estimation
              </span>
            </div>
            <div className="text-center">
              <p className="text-[26px] font-black text-orange-500 leading-tight">{prix}</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Selon la pièce défectueuse
              </p>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate(`/app/reparateurs?cat=${category}`)}
            className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
          >
            Trouver un réparateur maintenant
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => navigate("/app/nouvelle-demande")}
            className="w-full h-14 bg-white border border-gray-200 text-gray-900 font-black rounded-[14px] active:scale-95 transition-transform"
          >
            Faire une nouvelle demande
          </button>
        </div>
      </div>
    </div>
  );
}