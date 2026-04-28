import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, MapPin, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "../MobileShell";
import { CATEGORIES } from "./Home";
import { useGeolocation } from "../hooks/useGeolocation";
import { QUARTIERS_SAN_PEDRO } from "@/lib/haversine";
import { callDiagnosticIA } from "@/lib/supabaseExternal";

const URGENCY = [
  { id: "low", label: "Faible", color: "bg-brand-success-soft text-brand-success", emoji: "🟢" },
  { id: "medium", label: "Moyen", color: "bg-brand-warning-soft text-brand-warning", emoji: "🟡" },
  { id: "high", label: "Critique", color: "bg-brand-danger-soft text-brand-danger", emoji: "🔴" },
] as const;

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
  const canNext =
    (step === 0 && !!category) ||
    (step === 1 && description.length > 5) ||
    step === 2 ||
    step === 3 ||
    step === 4;

  async function launchDiagnostic() {
    setLoading(true);
    try {
      const result = await callDiagnosticIA(
        `Catégorie: ${category}. ${description}. Budget: ${budget || "non précisé"} FCFA. Quartier: ${quartier}.`,
        urgency
      );
      sessionStorage.setItem("dg-last-diagnostic", JSON.stringify({
        diagnostic: result.diagnostic, category, description, urgency, quartier, budget,
      }));
      navigate("/app/diagnostic/last");
    } catch (e: any) {
      toast.error("Diagnostic IA indisponible", { description: e?.message ?? "Réessaie dans un instant." });
      // Fallback : pas d'IA dispo, on enchaîne quand même
      sessionStorage.setItem("dg-last-diagnostic", JSON.stringify({
        diagnostic: "Le diagnostic automatique est temporairement indisponible. Un de nos réparateurs vérifiés va analyser votre demande directement sur place.",
        category, description, urgency, quartier, budget,
      }));
      navigate("/app/diagnostic/last");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell>
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            className="h-full bg-brand-primary"
          />
        </div>
        <div className="text-xs text-gray-500 font-semibold">{step + 1}/{totalSteps}</div>
      </div>

      <div className="px-5 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <>
                <h1 className="text-xl font-bold text-brand-navy mb-1">Quelle catégorie ?</h1>
                <p className="text-sm text-gray-500 mb-5">Choisissez le type de service.</p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const active = category === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${active ? "border-brand-primary bg-brand-primary-soft" : "border-border bg-white"}`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-2`}>
                          <Icon size={20} />
                        </div>
                        <div className="font-semibold text-sm text-brand-navy">{c.label}</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="text-xl font-bold text-brand-navy mb-1">Décrivez la panne</h1>
                <p className="text-sm text-gray-500 mb-5">Soyez précis pour un meilleur diagnostic.</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Ex: Mon climatiseur ne refroidit plus depuis hier soir..."
                  className="w-full p-4 rounded-2xl bg-white border border-border focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                />
                <button className="mt-3 w-full p-4 rounded-2xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-gray-500 text-sm">
                  <Camera size={18} /> Ajouter une photo (optionnel)
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-xl font-bold text-brand-navy mb-1">Niveau d'urgence</h1>
                <p className="text-sm text-gray-500 mb-5">Cela nous aide à prioriser votre demande.</p>
                <div className="space-y-3">
                  {URGENCY.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${urgency === u.id ? "border-brand-primary bg-brand-primary-soft" : "border-border bg-white"}`}
                    >
                      <span className="text-2xl">{u.emoji}</span>
                      <div>
                        <div className="font-semibold text-brand-navy">{u.label}</div>
                        <div className="text-xs text-gray-500">
                          {u.id === "low" && "Pas urgent, sous 48h"}
                          {u.id === "medium" && "Sous 24h"}
                          {u.id === "high" && "Le plus tôt possible"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-xl font-bold text-brand-navy mb-1">Localisation</h1>
                <p className="text-sm text-gray-500 mb-5">Confirmez votre quartier à San Pedro.</p>
                <div className="bg-white rounded-2xl p-4 border border-border mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary-soft text-brand-primary flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-brand-navy">
                      {position?.source === "gps" ? "Position GPS détectée" : "Position approximative"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : "..."}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUARTIERS_SAN_PEDRO.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuartier(q)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${quartier === q ? "border-brand-primary bg-brand-primary-soft text-brand-primary" : "border-border bg-white text-gray-600"}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="text-xl font-bold text-brand-navy mb-1">Budget estimé</h1>
                <p className="text-sm text-gray-500 mb-5">Optionnel — aide les réparateurs à se positionner.</p>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="25 000"
                    className="w-full pl-4 pr-20 py-4 rounded-2xl bg-white border border-border text-lg font-semibold focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">FCFA</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {[5000, 15000, 30000, 50000].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBudget(String(b))}
                      className="flex-1 py-2 rounded-xl bg-gray-100 text-xs font-semibold text-gray-600"
                    >
                      {(b / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-5 bg-gradient-to-t from-brand-bg via-brand-bg to-transparent">
        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="w-full bg-brand-navy text-white font-semibold py-4 rounded-2xl disabled:opacity-50 active:scale-95 transition-all"
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={launchDiagnostic}
            disabled={loading}
            className="w-full bg-brand-primary text-white font-semibold py-4 rounded-2xl shadow-glow-primary disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loading ? "Diagnostic en cours…" : "Lancer le diagnostic IA"}
          </button>
        )}
      </div>
    </MobileShell>
  );
}
