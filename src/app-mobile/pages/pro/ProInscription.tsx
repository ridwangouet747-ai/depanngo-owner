import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Upload, Check } from "lucide-react";
import { supabaseExt } from "@/lib/supabaseExternal";
import { useAuthClient } from "../../hooks/useAuthClient";
import { toast } from "sonner";

const SPECIALTIES = [
  { id: "electricite",    label: "Électricité"    },
  { id: "plomberie",      label: "Plomberie"       },
  { id: "climatisation",  label: "Climatisation"   },
  { id: "telephonie",     label: "Téléphonie"      },
  { id: "informatique",   label: "Informatique"    },
  { id: "electromenager", label: "Électroménager"  },
  { id: "menuiserie",     label: "Menuiserie"      },
  { id: "peinture",       label: "Peinture"        },
  { id: "serrurerie",     label: "Serrurerie"      },
  { id: "moto",           label: "Moto / Auto"     },
  { id: "maconnerie",     label: "Maçonnerie"      },
  { id: "jardinage",      label: "Jardinage"       },
];

const QUARTIERS = [
  "Bardot", "Cité", "Kpwesso", "Moro",
  "Lac", "Zone Industrielle", "San Pedro Port",
];

const STEPS = [
  "Informations personnelles",
  "Vos spécialités",
  "Zone d'intervention",
  "Upload CNI",
];

export default function ProInscription() {
  const navigate = useNavigate();
  const { user } = useAuthClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName]     = useState("");
  const [phone, setPhone]           = useState("");
  const [bio, setBio]               = useState("");
  const [experience, setExperience] = useState("1");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [quartier, setQuartier]     = useState("");
  const [cniRecto, setCniRecto]     = useState<File | null>(null);
  const [cniVerso, setCniVerso]     = useState<File | null>(null);

  const canNext =
    (step === 0 && fullName.length > 2 && phone.length >= 8) ||
    (step === 1 && selectedSpecs.length > 0) ||
    (step === 2 && quartier.length > 0) ||
    step === 3;

  function toggleSpec(id: string) {
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!user) { toast.error("Vous devez être connecté"); return; }
    setLoading(true);
    try {
      await supabaseExt.from("profiles").upsert({
        id: user.id, full_name: fullName,
        phone, role: "repairer", quartier,
      }, { onConflict: "id" });

      await supabaseExt.from("repairers").upsert({
        user_id: user.id,
        specialties: selectedSpecs,
        quartier, bio,
        experience_years: parseInt(experience),
        is_available: true,
        is_verified: false,
        average_rating: 0,
        trust_score: 100,
        total_missions: 0,
      }, { onConflict: "user_id" });

      toast.success("Inscription réussie ! En attente de validation.");
      navigate("/pro/home");
    } catch (e: any) {
      toast.error("Erreur", { description: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-32">

      {/* Header + barre progression */}
      <header className="px-5 pt-6 pb-4 sticky top-0 z-40 bg-[#F5F5F5]">
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => step === 0 ? navigate(-1) : setStep(step - 1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-black text-orange-500 uppercase tracking-widest">
                Étape {step + 1} sur {STEPS.length}
              </span>
              <span className="text-xs font-bold text-gray-400">
                {Math.round(((step + 1) / STEPS.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-black text-gray-900">{STEPS[step]}</h1>
      </header>

      <div className="px-5 mt-2">

        {/* Étape 0 — Infos */}
        {step === 0 && (
          <div className="space-y-4">
            {[
              { label: "Nom complet", value: fullName, set: setFullName, placeholder: "Ex: Kouassi Jean-Baptiste", type: "text" },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">{f.label}</label>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            ))}

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Numéro de téléphone</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+225</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07 00 00 00 00"
                  className="w-full h-12 pl-16 pr-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Années d'expérience</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              >
                {["1","2","3","4","5","6","7","8","9","10+"].map((y) => (
                  <option key={y} value={y}>{y} an{parseInt(y) > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Bio courte (optionnel)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Décrivez votre expertise en quelques mots..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Étape 1 — Spécialités */}
        {step === 1 && (
          <div>
            <p className="text-gray-400 text-sm mb-4">Sélectionnez une ou plusieurs spécialités</p>
            <div className="grid grid-cols-2 gap-3">
              {SPECIALTIES.map((s) => {
                const active = selectedSpecs.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSpec(s.id)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                      active ? "bg-orange-50 border-orange-500" : "bg-white border-gray-200"
                    }`}
                  >
                    <span className="font-bold text-gray-900 text-sm">{s.label}</span>
                    {active && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Étape 2 — Zone */}
        {step === 2 && (
          <div>
            <p className="text-gray-400 text-sm mb-4">Choisissez votre zone principale d'intervention</p>
            <div className="grid grid-cols-2 gap-3">
              {QUARTIERS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuartier(q)}
                  className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                    quartier === q
                      ? "bg-orange-50 border-orange-500 text-orange-500"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 3 — CNI */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <p className="text-sm text-orange-700 font-medium">
                📋 Votre CNI est nécessaire pour valider votre identité. Elle sera vérifiée par notre équipe sous 24h.
              </p>
            </div>

            {([
              { label: "CNI Recto", file: cniRecto, set: setCniRecto },
              { label: "CNI Verso", file: cniVerso, set: setCniVerso },
            ] as const).map((c) => (
              <div key={c.label}>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{c.label}</label>
                <label className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                  c.file ? "border-green-500 bg-green-50" : "border-gray-300 bg-white"
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => (c.set as any)(e.target.files?.[0] ?? null)}
                  />
                  {c.file ? (
                    <>
                      <Check size={24} className="text-green-500 mb-1" />
                      <span className="text-xs font-bold text-green-600 px-4 text-center truncate w-full text-center">{c.file.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400 mb-1" />
                      <span className="text-xs font-bold text-gray-400">Appuyer pour uploader</span>
                    </>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton fixe */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-md border-t border-gray-200 px-5 pt-4 pb-6 z-50">
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="w-full h-14 bg-orange-500 text-white font-black rounded-2xl disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: canNext ? "0 4px 20px rgba(232,89,12,0.3)" : "none" }}
          >
            Suivant <ArrowRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 bg-orange-500 text-white font-black rounded-2xl disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
          >
            {loading ? "Envoi en cours..." : "Soumettre mon inscription"}
            {!loading && <Check size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}