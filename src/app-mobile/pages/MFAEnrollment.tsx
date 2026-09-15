import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, Loader2, CheckCircle, Copy,
  Eye, EyeOff, Smartphone, KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { useMFA } from "../hooks/useMFA";
import {
  InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator,
} from "@/components/ui/input-otp";

type EnrollStep = "scan" | "verify" | "done";

export default function MFAEnrollment() {
  const navigate = useNavigate();
  const {
    loading, error, clearError,
    enrollTOTP, verifyEnrollment,
  } = useMFA();

  const [step, setStep] = useState<EnrollStep>("scan");
  const [factorId, setFactorId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const handleStartEnroll = useCallback(async () => {
    clearError();
    const result = await enrollTOTP("DÉPANN'GO Authenticator");
    if (result) {
      setFactorId(result.factorId);
      setQrCodeUrl(result.qrCodeDataUrl);
      setSecret(result.secret);
    }
  }, [enrollTOTP, clearError]);

  // Démarrer l'enrôlement au montage
  useEffect(() => {
    handleStartEnroll();
  }, [handleStartEnroll]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres");
      return;
    }
    clearError();
    const ok = await verifyEnrollment(factorId, code);
    if (ok) {
      setStep("done");
      toast.success("Double authentification activée !");
    }
  }, [code, factorId, verifyEnrollment, clearError]);

  const copySecret = useCallback(() => {
    navigator.clipboard.writeText(secret).then(() => {
      toast.success("Clé copiée !");
    }).catch(() => {
      toast.error("Impossible de copier");
    });
  }, [secret]);

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col max-w-[430px] mx-auto pb-32">
      {/* Header */}
      <header className="flex items-center px-6 pt-12 pb-4">
        <button
          onClick={() => step === "done" ? navigate("/app/profil/mfa-settings") : navigate(-1)}
          className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="flex-1 text-center font-black text-lg text-gray-900 mr-10">
          Ajouter un appareil
        </h1>
      </header>

      <div className="px-6 flex-1">
        {/* Loading initial */}
        {step === "scan" && !qrCodeUrl && (
          <div className="flex flex-col items-center justify-center pt-20">
            <Loader2 size={24} className="text-orange-500 animate-spin" />
            <p className="text-sm text-gray-400 font-semibold mt-4">Configuration en cours...</p>
          </div>
        )}

        {/* ═══ ÉTAPE SCAN QR CODE ═══ */}
        {step === "scan" && qrCodeUrl && (
          <div className="flex flex-col items-center pt-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-black text-gray-900 mb-2">
                Scannez le QR Code
              </h2>
              <p className="text-sm text-gray-400 font-semibold">
                Ouvrez votre application d'authentification et scannez ce code
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-md mb-6">
              <img
                src={qrCodeUrl}
                alt="QR Code TOTP"
                className="w-56 h-56"
              />
            </div>

            {/* Clé manuelle */}
            <div className="w-full bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Ou entrez la clé manuellement
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 font-mono text-sm font-bold text-gray-700 break-all">
                  {showSecret ? secret : "••••••••••••••••"}
                </div>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0"
                >
                  {showSecret ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
                </button>
                <button
                  onClick={copySecret}
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Copy size={16} className="text-gray-500" />
                </button>
              </div>
            </div>

            {error && (
              <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={() => setStep("verify")}
              className="w-full h-14 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform mt-4"
              style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
            >
              J'ai scanné le code
            </button>
          </div>
        )}

        {/* ═══ ÉTAPE VÉRIFICATION ═══ */}
        {step === "verify" && (
          <div className="flex flex-col items-center pt-8">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
              <KeyRound size={28} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2 text-center">
              Vérifiez l'activation
            </h2>
            <p className="text-sm text-gray-400 font-semibold text-center max-w-xs mb-8">
              Entrez le code à 6 chiffres affiché dans votre application d'authentification
            </p>

            <div className="mb-6">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value.replace(/\D/g, ""))}
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

            {error && (
              <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={code.length !== 6 || loading}
              className="w-full h-14 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              style={{ boxShadow: code.length === 6 ? "0 4px 20px rgba(232,89,12,0.3)" : "none" }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? "Vérification..." : "Vérifier et activer"}
            </button>

            <button
              onClick={() => { setStep("scan"); setCode(""); clearError(); }}
              className="mt-4 text-sm font-bold text-orange-500 py-3"
            >
              Retour au QR Code
            </button>
          </div>
        )}

        {/* ═══ ÉTAPE TERMINÉE ═══ */}
        {step === "done" && (
          <div className="flex flex-col items-center text-center pt-12">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              Appareil ajouté !
            </h2>
            <p className="text-sm text-gray-400 font-semibold max-w-xs leading-relaxed">
              Le nouvel appareil d'authentification est maintenant configuré.
              Il sera utilisé lors de votre prochaine connexion.
            </p>
            <button
              onClick={() => navigate("/app/profil/mfa-settings")}
              className="mt-8 w-full h-14 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
            >
              Retour aux paramètres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
