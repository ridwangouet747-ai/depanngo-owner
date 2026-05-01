import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Zap, Shield, Star } from "lucide-react";

const SLIDES = [
  {
    icon: Zap,
    color: "#FF6600",
    title: "Rapide",
    subtitle: "Trouvez un réparateur de confiance en moins de 60 secondes à San Pedro.",
    bg: "from-orange-500/20 to-transparent",
  },
  {
    icon: Shield,
    color: "#3B82F6",
    title: "Fiable",
    subtitle: "Réparateurs vérifiés, notés par la communauté, avec un Trust Score transparent.",
    bg: "from-blue-500/20 to-transparent",
  },
  {
    icon: Star,
    color: "#F59E0B",
    title: "Sécurisé",
    subtitle: "Acompte protégé, paiement Wave / Orange Money / MTN MoMo, support 24/7.",
    bg: "from-amber-500/20 to-transparent",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const Icon = slide.icon;

  function next() {
    if (isLast) {
      localStorage.setItem("dg-onboarding-done", "1");
      navigate("/app/auth");
    } else {
      setStep(step + 1);
    }
  }

  return (
    <div className="app-bg min-h-screen flex flex-col px-6 pt-16 pb-10 max-w-[430px] mx-auto">
      {/* Skip */}
      <div className="flex justify-between items-center mb-16">
        <span className="text-white font-black text-xl tracking-tight">
          DÉPANN<span className="text-brand-primary">'GO</span>
        </span>
        <button
          onClick={() => navigate("/app/auth")}
          className="text-white/40 text-sm font-medium"
        >
          Passer
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className={`w-32 h-32 rounded-4xl bg-gradient-to-br ${slide.bg} glass flex items-center justify-center mb-10 shadow-glass`}>
              <Icon size={56} style={{ color: slide.color }} />
            </div>

            <h1 className="text-5xl font-black text-white mb-4 glow-text">
              {slide.title}
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">
              {slide.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-brand-primary" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={next}
        className="btn-primary w-full flex items-center justify-center gap-2 text-base"
      >
        {isLast ? "Trouver un réparateur" : "Suivant"}
        <ChevronRight size={20} />
      </motion.button>
    </div>
  );
}