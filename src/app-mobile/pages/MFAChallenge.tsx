import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, ArrowLeft, LogOut, Smartphone, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useMFA, type MFAFactor } from "../hooks/useMFA";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator,
} from "@/components/ui/input-otp";

type ChallengeStep = "select" | "verify";

export default function MFAChallenge() {
  const navigate = useNavigate();
  const {
    loading, error, clearError,
    listFactors, challengeMFA, verifyChallenge,
  } = useMFA();

  const [step, setStep] = useState<ChallengeStep>("select");
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [selectedFactor, setSelectedFactor] = useState<MFAFactor | null>(null);
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 60;

  // Charger les facteurs vérifiés
  useEffect(() => {
    let cancelled = false;

    listFactors().then((f) => {
      if (cancelled) return;
      const verified = f.filter((fac) => fac.status === "verified");
      setFactors(verified);
      setInitialLoading(false);

      if (verified.length === 0) {
        // Pas de facteur MFA — rediriger
        navigate("/app/home", { replace: true });
      } else if (verified.length === 1) {
        // Un seul facteur → sélection auto + challenge direct
        setSelectedFactor(verified[0]);
        setStep("verify");
      }
      // Plusieurs facteurs → rester sur "select" pour que l'utilisateur choisisse
    });

    return () => { cancelled = true; };
  }, [listFactors, navigate]);

  // Créer un challenge quand un facteur est sélectionné
  const selectFactor = useCallback(async (factor: MFAFactor) => {
    setSelectedFactor(factor);
    clearError();
    setCode("");

    const cId = await challengeMFA(factor.id);
    if (cId) {
      setChallengeId(cId);
      setStep("verify");
    }
  }, [challengeMFA, clearError]);

  // Timer de verrouillage
  useEffect(() => {
    if (!locked) return;
    if (lockTimer <= 0) {
      setLocked(false);
      setAttempts(0);
      return;
    }
    const t = setTimeout(() => setLockTimer(lockTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [locked, lockTimer]);

  // Vérifier le code
  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || locked || !selectedFactor || !challengeId) return;

    clearError();
    const ok = await verifyChallenge(selectedFactor.id, challengeId, code);
    if (ok) {
      toast.success("Vérification réussie !");
      navigate("/app/home", { replace: true });
    } else {
      setAttempts((a) => a + 1);
      setCode("");
      if (attempts + 1 >= MAX_ATTEMPTS) {
        setLocked(true);
        setLockTimer(LOCK_DURATION);
        toast.error("Trop de tentatives. Veuillez patienter.");
      }
    }
  }, [code, locked, selectedFactor, challengeId, attempts, verifyChallenge, clearError, navigate]);

  // Auto-submit
  useEffect(() => {
    if (code.length === 6 && !locked && !loading) {
      handleVerify();
    }
  }, [code, locked, loading, handleVerify]);

  const handleLogout = useCallback(async () => {
    await supabaseClient.auth.signOut();
    navigate("/app/auth", { replace: true });
  }, [navigate]);

  const handleNewChallenge = useCallback(async () => {
    if (!selectedFactor) return;
    setCode("");
    clearError();
    const cId = await challengeMFA(selectedFactor.id);
    if (cId) setChallengeId(cId);
  }, [selectedFactor, challengeMFA, clearError]);

  const handleBack = useCallback(() => {
    if (factors.length > 1) {
      setStep("select");
      setSelectedFactor(null);
      setChallengeId("");
      setCode("");
      setAttempts(0);
      setLocked(false);
      clearError();
    } else {
      handleLogout();
    }
  }, [factors, handleLogout, clearError]);

  if (initialLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col max-w-[430px] mx-auto">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="text-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col max-w-[430px] mx-auto">
      {/* Header */}
      <header className="flex items-center px-6 pt-12 pb-4">
        <button
          onClick={handleBack}
          className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="flex-1 text-center font-black text-lg text-gray-900 mr-10">
          {step === "select" ? "Authentification" : "Vérification"}
        </h1>
      </header>

      <div className="px-6 flex-1 flex flex-col items-center">
        {/* ═══ ÉTAPE SÉLECTION DU FACTEUR ═══ */}
        {step === "select" && factors.length > 1 && (
          <>
            <div className="flex justify-center mb-6">
              <div className="px-4 py-2 bg-orange-50 border border-orange-500 rounded-full">
                <span className="text-xs text-orange-500 font-black uppercase tracking-wider">
                  ✦ Choisir votre méthode
                </span>
              </div>
            </div>

            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
              <ShieldCheck size={40} className="text-orange-500" />
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-3 text-center">
              Vérification requise
            </h2>
            <p className="text-sm text-gray-400 font-semibold text-center max-w-xs leading-relaxed mb-8">
              Choisissez votre méthode d'authentification
            </p>

            <div className="w-full space-y-3">
              {factors.map((f) => (
                <button
                  key={f.id}
                  onClick={() => selectFactor(f)}
                  className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-all shadow-sm hover:border-orange-200"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                    <Smartphone size={20} className="text-orange-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm text-gray-900">
                      {f.friendly_name || "Authentificateur TOTP"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Ajouté le {new Date(f.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ═══ ÉTAPE VÉRIFICATION ═══ */}
        {step === "verify" && (
          <>
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="px-4 py-2 bg-orange-50 border border-orange-500 rounded-full">
                <span className="text-xs text-orange-500 font-black uppercase tracking-wider">
                  ✦ Vérification en deux étapes
                </span>
              </div>
            </div>

            {/* Icône */}
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
              <ShieldCheck size={40} className="text-orange-500" />
            </div>

            {/* Titre + facteur sélectionné */}
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">
              Code de sécurité
            </h2>
            {selectedFactor && (
              <p className="text-xs text-gray-400 font-semibold text-center mb-1">
                {selectedFactor.friendly_name || "Authentificateur TOTP"}
              </p>
            )}
            <p className="text-sm text-gray-400 font-semibold text-center max-w-xs leading-relaxed mb-8">
              Ouvrez votre application d'authentification et saisissez le code à 6 chiffres
            </p>

            {/* Input OTP */}
            <div className="mb-4">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value.replace(/\D/g, ""))}
                disabled={locked}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Erreur */}
            {error && (
              <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-red-600">{error}</p>
              </div>
            )}

            {/* Lock */}
            {locked && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-amber-600">
                  Trop de tentatives. Nouvelle tentative dans {lockTimer}s
                </p>
              </div>
            )}

            {/* Tentatives */}
            {attempts > 0 && !locked && (
              <p className="text-xs text-amber-500 font-semibold mb-4">
                Tentative {attempts}/{MAX_ATTEMPTS}
              </p>
            )}

            {/* Loading */}
            {loading && (
              <div className="w-full bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <Loader2 size={16} className="text-orange-500 animate-spin" />
                <p className="text-xs font-semibold text-orange-600">Vérification en cours...</p>
              </div>
            )}

            {/* Régénérer */}
            <button
              onClick={handleNewChallenge}
              disabled={locked || loading}
              className="text-sm font-bold text-orange-500 py-3 disabled:opacity-40"
            >
              Régénérer le code
            </button>

            {/* Changer de méthode (si multi-facteurs) */}
            {factors.length > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="text-sm font-semibold text-gray-400 py-2 disabled:opacity-40"
              >
                Changer de méthode
              </button>
            )}

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-400 py-3"
            >
              <LogOut size={16} />
              Se déconnecter
            </button>
          </>
        )}
      </div>
    </div>
  );
}
