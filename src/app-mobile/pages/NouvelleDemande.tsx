import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, ArrowRight, Camera, MapPin, Loader2, Sparkles, Check, Zap, Droplets, Wind, Smartphone, Monitor, Microwave, Hammer, PaintBucket, Key, Car, Building, Leaf } from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { QUARTIERS_SAN_PEDRO } from "@/lib/haversine";
import { callDiagnosticIA } from "@/lib/supabaseExternal";

const CATEGORIES = [
  { id: "electricite",    label: "Électricité",   icon: Zap },
  { id: "plomberie",      label: "Plomberie",      icon: Droplets },
  { id: "climatisation",  label: "Climatisation",  icon: Wind },
  { id: "telephonie",     label: "Téléphonie",     icon: Smartphone },
  { id: "informatique",   label: "Informatique",   icon: Monitor },
  { id: "electromenager", label: "Appareils",      icon: Microwave },
  { id: "menuiserie",     label: "Menuiserie",     icon: Hammer },
  { id: "peinture",       label: "Peinture",       icon: PaintBucket },
  { id: "serrurerie",     label: "Serrurerie",     icon: Key },
  { id: "moto",           label: "Moto / Auto",    icon: Car },
  { id: "maconnerie",     label: "Maçonnerie",     icon: Building },
  { id: "jardinage",      label: "Jardinage",      icon: Leaf },
];

const URGENCY = [
  { id: "low",    label: "Faible",   emoji: "🟢", desc: "Pas urgent, sous 48h" },
  { id: "medium", label: "Moyen",    emoji: "🟡", desc: "Sous 24h" },
  { id: "high",   label: "Critique", emoji: "🔴", desc: "Le plus tôt possible" },
] as const;

const STEPS = [
  "Quelle catégorie de service ?",
  "Décrivez la panne",
  "Niveau d'urgence",
  "Localisation",
  "Budget estimé",
];

export default function NouvelleDemande() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { position } = useGeolocation();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string>(params.get("cat") ?? "");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [quartier, setQuartier] = useState<string>("Bardot");
  const [budget, setBudget] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const totalSteps = 5;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const canNext =
    (step === 0 && !!category) ||
    (step === 1 && description.length > 5) ||
    step === 2 || step === 3 || step === 4;

  async function launchDiagnostic() {
    setLoading(true);
    try {
      let diagnostic = "";
      try {
        const result = await callDiagnosticIA(
          `Catégorie: ${category}. ${description}. Budget: ${budget || "non précisé"} FCFA. Quartier: ${quartier}.`,
          urgency
        );
        diagnostic = result.diagnostic;
      } catch {
        const demos: Record<string, string> = {
          electricite: `🔍 DIAGNOSTIC PROBABLE\n→ Problème électrique détecté.\n\n⚠️ GRAVITÉ\n→ 🟡 MOYEN\n\n🔧 TECHNICIEN\n→ Électricien\n\n💡 EN ATTENDANT\n→ Coupez l'alimentation générale\n\n💰 PRIX\n→ Entre 5 000 et 20 000 FCFA`,
          plomberie: `🔍 DIAGNOSTIC\n→ Fuite ou obstruction détectée.\n\n⚠️ GRAVITÉ\n→ 🟡 MOYEN\n\n🔧 TECHNICIEN\n→ Plombier\n\n💡 EN ATTENDANT\n→ Fermez le robinet général\n\n💰 PRIX\n→ Entre 8 000 et 25 000 FCFA`,
          climatisation: `🔍 DIAGNOSTIC\n→ Problème de gaz ou filtre encrassé.\n\n⚠️ GRAVITÉ\n→ 🟡 MOYEN\n\n🔧 TECHNICIEN\n→ Technicien climatisation\n\n💡 EN ATTENDANT\n→ Éteignez le climatiseur\n\n💰 PRIX\n→ Entre 10 000 et 35 000 FCFA`,
          telephonie: `🔍 DIAGNOSTIC\n→ Problème logiciel ou matériel.\n\n⚠️ GRAVITÉ\n→ 🟢 FAIBLE\n\n🔧 TECHNICIEN\n→ Technicien téléphonie\n\n💡 EN ATTENDANT\n→ Sauvegardez vos données\n\n💰 PRIX\n→ Entre 3 000 et 15 000 FCFA`,
        };
        diagnostic = demos[category] ?? `🔍 DIAGNOSTIC\n→ Panne détectée. Technicien requis.\n\n⚠️ GRAVITÉ\n→ 🟡 MOYEN\n\n💰 PRIX\n→ Entre 5 000 et 25 000 FCFA`;
      }
      sessionStorage.setItem("dg-last-diagnostic", JSON.stringify({
        diagnostic, category, description, urgency, quartier, budget,
      }));
      navigate("/app/diagnostic/last");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col pb-32">

      {/* Header Progress */}
      <header className="px-5 pt-6 pb-4 bg-[#F5F5F5] sticky top-0 z-40">
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => step === 0 ? navigate(-1) : setStep(step - 1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 shrink-0"
          >
            <X size={18} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-black text-orange-500 uppercase tracking-widest">
                Étape {step + 1} sur {totalSteps}
              </span>
              <span className="text-xs font-bold text-gray-400">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{STEPS[step]}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {step === 0 && "Choisissez le domaine qui correspond à votre problème."}
          {step === 1 && "Soyez précis pour un meilleur diagnostic."}
          {step === 2 && "Cela nous aide à prioriser votre demande."}
          {step === 3 && "Confirmez votre quartier à San Pedro."}
          {step === 4 && "Optionnel — aide les réparateurs à se positionner."}
        </p>
      </header>

      {/* Contenu par étape */}
      <div className="px-5 mt-2 flex-1">

        {/* Étape 0 — Catégories */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`relative p-5 rounded-3xl flex flex-col items-center gap-3 transition-all active:scale-95 shadow-sm ${
                    active
                      ? "bg-orange-50 border-2 border-orange-500"
                      : "bg-white border-2 border-transparent border border-gray-100"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    active ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Icon size={22} />
                  </div>
                  <span className="font-bold text-gray-900 text-sm text-center">{c.label}</span>
                  {active && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Étape 1 — Description */}
        {step === 1 && (
          <div className="space-y-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Ex: Mon climatiseur ne refroidit plus depuis hier soir, il fait un bruit bizarre..."
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <button className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center gap-2 text-gray-400 text-sm font-medium active:scale-95 transition-transform">
              <Camera size={18} /> Ajouter une photo (optionnel)
            </button>
          </div>
        )}

        {/* Étape 2 — Urgence */}
        {step === 2 && (
          <div className="space-y-3">
            {URGENCY.map((u) => (
              <button
                key={u.id}
                onClick={() => setUrgency(u.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                  urgency === u.id
                    ? "bg-orange-50 border-orange-500"
                    : "bg-white border-gray-200"
                }`}
              >
                <span className="text-3xl">{u.emoji}</span>
                <div>
                  <div className="font-bold text-gray-900">{u.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{u.desc}</div>
                </div>
                {urgency === u.id && (
                  <div className="ml-auto w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Étape 3 — Localisation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {position?.source === "gps" ? "Position GPS détectée" : "Position approximative"}
                </div>
                <div className="text-xs text-gray-400">
                  {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : "San Pedro, CI"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUARTIERS_SAN_PEDRO.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuartier(q)}
                  className={`px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    quartier === q
                      ? "border-orange-500 bg-orange-50 text-orange-500"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 4 — Budget */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="25 000"
                className="w-full pl-4 pr-20 py-5 rounded-2xl bg-white border-2 border-gray-200 text-xl font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">FCFA</span>
            </div>
            <div className="flex gap-2">
              {[5000, 15000, 30000, 50000].map((b) => (
                <button
                  key={b}
                  onClick={() => setBudget(String(b))}
                  className="flex-1 py-3 rounded-xl bg-white border-2 border-gray-200 text-xs font-bold text-gray-600 active:border-orange-500 active:text-orange-500 transition-all"
                >
                  {(b / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
              <p className="text-xs text-gray-500 leading-relaxed">
                💡 En indiquant un budget, les réparateurs peuvent mieux préparer leur intervention. Ce montant n'est pas contraignant.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bouton fixe */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/80 backdrop-blur-md border-t border-gray-200 px-5 pt-4 pb-6 z-50">
        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="w-full h-14 bg-orange-500 text-white font-black rounded-2xl shadow-lg disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2 text-base"
            style={{ boxShadow: canNext ? "0 4px 20px rgba(232,89,12,0.3)" : "none" }}
          >
            Suivant
            <ArrowRight size={20} />
          </button>
        ) : (
          <button
            onClick={launchDiagnostic}
            disabled={loading}
            className="w-full h-14 bg-orange-500 text-white font-black rounded-2xl disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center gap-2 text-base"
            style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {loading ? "Diagnostic en cours…" : "Lancer le diagnostic IA"}
          </button>
        )}
      </div>
    </div>
  );
}