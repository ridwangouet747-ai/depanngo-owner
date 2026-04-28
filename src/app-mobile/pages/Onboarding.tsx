import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, ShieldCheck, Rocket, ChevronRight } from "lucide-react";
import { MobileShell } from "../MobileShell";

const SLIDES = [
  {
    icon: Rocket,
    title: "Rapide",
    text: "Trouvez un réparateur de confiance en moins de 60 secondes à San Pedro.",
    color: "from-brand-primary to-brand-primary-hover",
  },
  {
    icon: ShieldCheck,
    title: "Fiable",
    text: "Réparateurs vérifiés, notés par la communauté, avec un Trust Score transparent.",
    color: "from-brand-info to-brand-navy",
  },
  {
    icon: Zap,
    title: "Sécurisé",
    text: "Acompte protégé, paiement Wave / Orange Money / MTN MoMo, support 24/7.",
    color: "from-brand-success to-brand-info",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <MobileShell noBottomPad>
      <div className="flex flex-col min-h-screen p-6">
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm font-bold tracking-tight text-brand-navy">
            DÉPANN<span className="text-brand-primary">'GO</span>
          </div>
          <button
            onClick={() => navigate("/app/auth")}
            className="text-xs font-medium text-gray-500 hover:text-brand-primary"
          >
            Passer
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.96 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-glow-primary mb-8`}>
                <Icon className="text-white" size={56} strokeWidth={2.2} />
              </div>
              <h1 className="text-3xl font-bold text-brand-navy mb-3">{slide.title}</h1>
              <p className="text-gray-600 text-base leading-relaxed max-w-xs">{slide.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-8 bg-brand-primary" : "w-1.5 bg-gray-300"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? navigate("/app/auth") : setStep(step + 1))}
          className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-4 rounded-2xl shadow-glow-primary flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {isLast ? "Trouver un réparateur" : "Suivant"}
          <ChevronRight size={18} />
        </button>
      </div>
    </MobileShell>
  );
}
