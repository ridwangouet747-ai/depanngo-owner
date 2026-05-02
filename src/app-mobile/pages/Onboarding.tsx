import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    icon: Zap,
    title: "Rapide",
    description:
      "Trouvez un réparateur de confiance en moins de 60 secondes à San Pedro, Côte d'Ivoire.",
  },
  {
    icon: ShieldCheck,
    title: "Fiable",
    description:
      "Réparateurs vérifiés, notés par la communauté avec un Trust Score transparent de 0 à 100.",
  },
  {
    icon: Lock,
    title: "Sécurisé",
    description:
      "Acompte protégé, paiement Wave, Orange Money ou MTN MoMo. Remboursement garanti.",
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const isLast = current === SLIDES.length - 1;

  function handleNext() {
    if (!isLast) {
      setCurrent(current + 1);
    } else {
      localStorage.setItem("dg-onboarding-done", "1");
      navigate("/app/auth");
    }
  }

  function handleSkip() {
    localStorage.setItem("dg-onboarding-done", "1");
    navigate("/app/auth");
  }

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col max-w-[430px] mx-auto overflow-hidden">

      {/* Header */}
      <header className="flex justify-between items-center px-6 pt-12">
        <div className="flex items-center">
          <span className="text-xl font-black tracking-tight text-gray-900">DÉPANN</span>
          <span className="text-xl font-black text-orange-500">'GO</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-gray-400 font-bold text-sm"
        >
          Passer
        </button>
      </header>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Illustration */}
            <div className="w-56 h-56 bg-orange-50 rounded-full flex items-center justify-center mb-10 shadow-inner">
              <Icon
                size={80}
                className="text-orange-500"
                strokeWidth={1.5}
              />
            </div>

            {/* Titre */}
            <h1 className="text-3xl font-black text-gray-900 mb-4">
              {slide.title}
            </h1>

            {/* Description */}
            <p className="text-[15px] text-gray-500 leading-relaxed max-w-[280px]">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-12 flex flex-col items-center">

        {/* Points de navigation */}
        <div className="flex gap-2 mb-10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-orange-500"
                  : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Bouton principal */}
        <button
          onClick={handleNext}
          className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform text-base"
          style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
        >
          {isLast ? "Trouver un réparateur" : "Suivant"}
          {!isLast && <ArrowRight size={20} />}
        </button>
      </div>
    </div>
  );
}