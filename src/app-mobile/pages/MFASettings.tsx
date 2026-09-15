import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, ShieldOff, Loader2, AlertTriangle,
  CheckCircle, Smartphone, KeyRound, Lock, Plus, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useMFA, type MFAFactor } from "../hooks/useMFA";
import {
  InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator,
} from "@/components/ui/input-otp";

type ModalState = null | {
  type: "delete";
  factor: MFAFactor;
  step: "confirm" | "verify";
  challengeId: string;
};

export default function MFASettings() {
  const navigate = useNavigate();
  const {
    loading, error, clearError,
    listFactors, unenrollMFA, challengeMFA, verifyChallenge,
  } = useMFA();

  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [verifyCode, setVerifyCode] = useState("");

  const verifiedFactors = factors.filter((f) => f.status === "verified");
  const isEnrolled = verifiedFactors.length > 0;

  const loadFactors = useCallback(async () => {
    const f = await listFactors();
    setFactors(f);
    setInitialLoading(false);
  }, [listFactors]);

  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  // ── Suppression d'un facteur ──
  const handleStartDelete = useCallback(async (factor: MFAFactor) => {
    // Règle de sécurité : ne pas supprimer le dernier facteur vérifié
    if (factor.status === "verified" && verifiedFactors.length <= 1) {
      toast.error("Impossible", {
        description: "Ajoutez un appareil de secours avant de supprimer celui-ci.",
      });
      return;
    }

    clearError();
    const cId = await challengeMFA(factor.id);
    if (cId) {
      setModal({
        type: "delete",
        factor,
        step: "verify",
        challengeId: cId,
      });
      setVerifyCode("");
    }
  }, [verifiedFactors, challengeMFA, clearError]);

  const handleConfirmDelete = useCallback(async () => {
    if (!modal || modal.type !== "delete" || verifyCode.length !== 6) return;

    clearError();
    const verified = await verifyChallenge(
      modal.factor.id,
      modal.challengeId,
      verifyCode
    );
    if (!verified) return;

    const ok = await unenrollMFA(modal.factor.id);
    if (ok) {
      setFactors((prev) => prev.filter((f) => f.id !== modal.factor.id));
      setModal(null);
      setVerifyCode("");
      toast.success("Facteur supprimé");
    }
  }, [modal, verifyCode, verifyChallenge, unenrollMFA, clearError]);

  const handleCancelModal = useCallback(() => {
    setModal(null);
    setVerifyCode("");
    clearError();
  }, [clearError]);

  if (initialLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col max-w-[430px] mx-auto">
        <header className="flex items-center px-6 pt-12 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center font-black text-lg text-gray-900 mr-10">
            Sécurité
          </h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="text-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

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
          Sécurité
        </h1>
      </header>

      <div className="px-6 flex-1">
        {/* Section Statut */}
        <section className="mb-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
            Authentification à deux facteurs
          </h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isEnrolled ? "bg-green-50" : "bg-gray-100"
                }`}>
                  <ShieldCheck size={18} className={isEnrolled ? "text-green-500" : "text-gray-400"} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {isEnrolled ? "Activée" : "Désactivée"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {isEnrolled
                      ? `${verifiedFactors.length} appareil(s) configuré(s)`
                      : "Ajoutez une couche de sécurité"
                    }
                  </p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                isEnrolled ? "bg-green-500 animate-pulse" : "bg-gray-300"
              }`} />
            </div>

            {!isEnrolled && (
              <button
                onClick={() => navigate("/app/mfa/enroll")}
                className="w-full h-12 bg-orange-500 text-white font-black rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm mt-4"
                style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
              >
                <ShieldCheck size={18} />
                Activer la double authentification
              </button>
            )}
          </div>
        </section>

        {/* Section Facteurs */}
        {isEnrolled && (
          <section className="mb-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
              Facteurs d'authentification
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {factors.map((f, i) => {
                const isVerified = f.status === "verified";
                const isLastVerified = isVerified && verifiedFactors.length <= 1;
                return (
                  <div key={f.id}>
                    <div className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isVerified ? "bg-green-50" : "bg-amber-50"
                      }`}>
                        {isVerified ? (
                          <CheckCircle size={18} className="text-green-500" />
                        ) : (
                          <AlertTriangle size={18} className="text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {f.friendly_name || "Authentificateur TOTP"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[11px] font-semibold ${
                            isVerified ? "text-green-500" : "text-amber-500"
                          }`}>
                            {isVerified ? "Vérifié" : "En attente"}
                          </span>
                          <span className="text-[11px] text-gray-300">·</span>
                          <p className="text-[11px] text-gray-400">
                            {new Date(f.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartDelete(f)}
                        disabled={isLastVerified || loading}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isLastVerified
                            ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                            : "bg-red-50 text-red-400 active:bg-red-100"
                        }`}
                        title={isLastVerified ? "Impossible de supprimer le dernier appareil" : "Supprimer"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {i < factors.length - 1 && <div className="h-px bg-gray-100 mx-4" />}
                  </div>
                );
              })}

              {/* Bouton ajouter */}
              <div className="h-px bg-gray-100 mx-4" />
              <button
                onClick={() => navigate("/app/mfa/enroll")}
                className="w-full p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                  <Plus size={18} className="text-orange-500" />
                </div>
                <p className="text-sm font-bold text-orange-500">
                  Ajouter un appareil
                </p>
              </button>
            </div>

            {/* Info sécurité */}
            {isLastVerified === false && verifiedFactors.length === 1 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-3">
                <p className="text-[11px] font-semibold text-amber-600">
                  💡 Ajoutez un appareil de secours pour ne pas perdre l'accès à votre compte.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Section Applications compatibles */}
        <section>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
            Applications compatibles
          </h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {[
              { name: "Google Authenticator", desc: "iOS & Android" },
              { name: "Microsoft Authenticator", desc: "iOS & Android" },
              { name: "Aegis Authenticator", desc: "Android (open source)" },
              { name: "1Password", desc: "iOS, Android, Desktop" },
              { name: "Bitwarden", desc: "iOS, Android, Desktop" },
            ].map((app, i, arr) => (
              <div key={app.name}>
                <div className="px-4 py-3 flex items-center gap-3">
                  <KeyRound size={14} className="text-gray-300" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{app.name}</p>
                    <p className="text-[11px] text-gray-400">{app.desc}</p>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="h-px bg-gray-100 mx-4" />}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ═══ MODAL SUPPRESSION ═══ */}
      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancelModal} />
          <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl p-6 pb-8 space-y-5 animate-in slide-in-from-bottom">
            {modal.step === "confirm" ? (
              <>
                <button onClick={handleCancelModal} className="absolute top-4 right-4 text-gray-400">
                  <X size={20} />
                </button>
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black text-gray-900 mb-2">
                    Supprimer cet appareil ?
                  </h3>
                  <p className="text-sm text-gray-400 font-semibold">
                    Vous ne pourrez plus utiliser cet appareil pour la connexion.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setModal({ ...modal, step: "verify" })}
                    className="w-full h-12 bg-red-500 text-white font-black rounded-xl flex items-center justify-center gap-2 text-sm"
                  >
                    <Lock size={18} />
                    Confirmer
                  </button>
                  <button onClick={handleCancelModal} className="w-full h-12 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm">
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <button onClick={handleCancelModal} className="absolute top-4 right-4 text-gray-400">
                  <X size={20} />
                </button>
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck size={24} className="text-orange-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black text-gray-900 mb-2">
                    Code de confirmation
                  </h3>
                  <p className="text-sm text-gray-400 font-semibold">
                    Entrez le code de votre application pour confirmer la suppression
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verifyCode}
                    onChange={(v) => setVerifyCode(v.replace(/\D/g, ""))}
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
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-600">{error}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleConfirmDelete}
                    disabled={verifyCode.length !== 6 || loading}
                    className="w-full h-12 bg-red-500 text-white font-black rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    {loading ? "Suppression..." : "Supprimer l'appareil"}
                  </button>
                  <button onClick={handleCancelModal} className="w-full h-12 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm">
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
