import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, MapPin, Loader2, Sparkles } from "lucide-react";
import { MobileShell } from "../MobileShell";
import { CATEGORIES } from "./Home";
import { useGeolocation } from "../hooks/useGeolocation";
import { QUARTIERS_SAN_PEDRO } from "@/lib/haversine";
import { callDiagnosticIA } from "@/lib/supabaseExternal";

const URGENCY = [
  { id: "low",    label: "Faible",   emoji: "🟢", desc: "Pas urgent, sous 48h" },
  { id: "medium", label: "Moyen",    emoji: "🟡", desc: "Sous 24h" },
  { id: "high",   label: "Critique", emoji: "🔴", desc: "Le plus tôt possible" },
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
          electricite: `🔍 DIAGNOSTIC PROBABLE\n→ Problème électrique détecté. Vérifiez le disjoncteur principal et les fusibles.\n\n⚠️ NIVEAU DE GRAVITÉ\n→ 🟡 MOYEN : À traiter dans la journée\n\n🔧 TYPE DE TECHNICIEN REQUIS\n→ Électricien\n\n💡 CE QUE TU PEUX FAIRE EN ATTENDANT\n→ Coupez l'alimentation générale\n→ Évitez d'utiliser les prises défectueuses\n\n💰 FOURCHETTE DE PRIX ESTIMÉE\n→ Entre 5 000 et 20 000 FCFA`,
          plomberie: `🔍 DIAGNOSTIC PROBABLE\n→ Fuite ou obstruction détectée.\n\n⚠️ NIVEAU DE GRAVITÉ\n→ 🟡 MOYEN\n\n🔧 TYPE DE TECHNICIEN REQUIS\n→ Plombier\n\n💡 EN ATTENDANT\n→ Fermez le robinet général\n\n💰 PRIX ESTIMÉ\n→ Entre 8 000 et 25 000 FCFA`,
          climatisation: `🔍 DIAGNOSTIC PROBABLE\n→ Problème de gaz ou filtre encrassé.\n\n⚠️ NIVEAU DE GRAVITÉ\n→ 🟡 MOYEN\n\n🔧 TECHNICIEN REQUIS\n→ Technicien climatisation\n\n💡 EN ATTENDANT\n→ Éteignez le climatiseur\n\n💰 PRIX ESTIMÉ\n→ Entre 10 000 et 35 000 FCFA`,
          telephonie: `🔍 DIAGNOSTIC PROBABLE\n→ Problème logiciel ou matériel.\n\n⚠️ GRAVITÉ\n→ 🟢 FAIBLE\n\n🔧 TECHNICIEN\n→ Technicien téléphonie\n\n💡 EN ATTENDANT\n→ Sauvegardez vos données\n\n💰 PRIX\n→ Entre 3 000 et 15 000 FCFA`,
          informatique: `🔍 DIAGNOSTIC\n→ Problème système ou matériel.\n\n⚠️ GRAVITÉ\n→ 🟢 FAIBLE\n\n🔧 TECHNICIEN\n→ Technicien informatique\n\n💡 EN ATTENDANT\n→ Sauvegardez vos fichiers\n\n💰 PRIX\n→ Entre 5 000 et 20 000 FCFA`,
          electromenager: `🔍 DIAGNOSTIC\n→ Panne électronique ou mécanique.\n\n⚠️ GRAVITÉ\n→ 🟡 MOYEN\n\n🔧 TECHNICIEN\n→ Technicien électroménager\n\n💡 EN ATTENDANT\n→ Débranchez l'appareil\n\n💰 PRIX\n→ Entre 8 000 et 30 000 FCFA`,
        };
        diagnostic = demos[category] ?? `🔍 DIAGNOSTIC\n→ Panne détectée. Un technicien analysera sur place.\n\n⚠️ GRAVITÉ\n→ 🟡 MOYEN\n\n🔧 TECHNICIEN\n→ Spécialiste requis\n\n💰 PRIX\n→ Entre 5 000 et 25 000 FCFA`;
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
    <MobileShell>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
          className="w-10 h-10 rounded-full glass flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            className="h-full bg-brand-primary"
          />
        </div>
        <div className="text-xs text-white/40 font-semibold">{step + 1}/{totalSteps}</div>
      </div>

      <div className="px-5 pt-4 pb-40">
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
                <h1 className="text-2xl font-black text-white mb-1">Quelle catégorie ?</h1>
                <p className="text-sm text-white/50 mb-5">Choisissez le type de service.</p>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const active = category === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                          active
                            ? "border-brand-primary glass-strong shadow-glow-sm"
                            : "border-white/10 glass"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center`}>
                          <Icon size={18} />
                        </div>
                        <span className="text-[10px] font-semibold text-white text-center leading-tight">
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="text-2xl font-black text-white mb-1">Décrivez la panne</h1>
                <p className="text-sm text-white/50 mb-5">Soyez précis pour un meilleur diagnostic.</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Ex: Mon climatiseur ne refroidit plus depuis hier soir..."
                  className="w-full p-4 rounded-2xl glass border border-white/10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                />
                <button className="mt-3 w-full p-4 rounded-2xl border border-dashed border-white/20 glass flex items-center justify-center gap-2 text-white/50 text-sm">
                  <Camera size={18} /> Ajouter une photo (optionnel)
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-2xl font-black text-white mb-1">Niveau d'urgence</h1>
                <p className="text-sm text-white/50 mb-5">Cela nous aide à prioriser votre demande.</p>
                <div className="space-y-3">
                  {URGENCY.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                        urgency === u.id
                          ? "border-brand-primary glass-strong"
                          : "border-white/10 glass"
                      }`}
                    >
                      <span className="text-2xl">{u.emoji}</span>
                      <div>
                        <div className="font-bold text-white">{u.label}</div>
                        <div className="text-xs text-white/50">{u.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-2xl font-black text-white mb-1">Localisation</h1>
                <p className="text-sm text-white/50 mb-5">Confirmez votre quartier à San Pedro.</p>
                <div className="glass rounded-2xl p-4 border border-white/10 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-white">
                      {position?.source === "gps" ? "Position GPS détectée" : "Position approximative"}
                    </div>
                    <div className="text-xs text-white/40">
                      {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : "San Pedro, CI"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUARTIERS_SAN_PEDRO.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuartier(q)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        quartier === q
                          ? "border-brand-primary glass-strong text-white"
                          : "border-white/10 glass text-white/60"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="text-2xl font-black text-white mb-1">Budget estimé</h1>
                <p className="text-sm text-white/50 mb-5">Optionnel — aide les réparateurs à se positionner.</p>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="25 000"
                    className="w-full pl-4 pr-20 py-4 rounded-2xl glass border border-white/10 text-white text-lg font-semibold placeholder:text-white/30 focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-semibold text-sm">FCFA</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {[5000, 15000, 30000, 50000].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBudget(String(b))}
                      className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-xs font-bold text-white/70"
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

      {/* Bouton fixe — au-dessus de la bottom nav */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 z-50">
        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="w-full btn-primary disabled:opacity-30 flex items-center justify-center"
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={launchDiagnostic}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loading ? "Diagnostic en cours…" : "Lancer le diagnostic IA"}
          </button>
        )}
      </div>
    </MobileShell>
  );
}