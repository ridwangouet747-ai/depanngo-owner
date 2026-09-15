import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, Phone, KeyRound, ArrowLeft,
  User, Wrench, Loader2, MessageSquare, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabaseClient";

type AuthMethod = "phone" | "email";
type Step = "input" | "otp" | "signup";

// Vérifier si la 2FA est activée et rediriger en conséquence
async function checkMFAAndRedirect(navigate: ReturnType<typeof useNavigate>) {
  try {
    const { data } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
    const hasEnrolled = (data?.factors ?? []).some(
      (f) => f.factor_type === "totp" && f.status === "verified"
    );
    if (hasEnrolled && data?.currentLevel === "aal1") {
      navigate("/app/mfa/challenge", { replace: true });
      return;
    }
  } catch {
    // Ignorer — on redirige vers home par défaut
  }
  navigate("/app/home", { replace: true });
}

export default function Auth() {
  const navigate = useNavigate();

  const [method, setMethod] = useState<AuthMethod>("phone");
  const [step, setStep] = useState<Step>("input");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"client" | "repairer">("client");

  const canSendOtp = method === "phone"
    ? phone.replace(/\s/g, "").length >= 8
    : email.length > 3 && email.includes("@");

  async function handleSendOtp() {
    if (method === "phone") {
      const cleanPhone = phone.replace(/\s/g, "");
      const fullPhone = cleanPhone.startsWith("+225") ? cleanPhone : `+225${cleanPhone}`;

      setLoading(true);
      try {
        const { error } = await supabaseClient.auth.signInWithOtp({
          phone: fullPhone,
        });
        if (error) throw error;
        toast.success("Code envoyé !");
        setStep("otp");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur lors de l'envoi du code";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const { data, error } = await supabaseClient.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin + "/app/home" },
        });
        if (error) throw error;

        if (data.user?.identities?.length === 0) {
          setStep("signup");
        } else {
          toast.success("Lien de connexion envoyé par email !");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur lors de l'envoi";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres");
      return;
    }
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\s/g, "");
      const fullPhone = cleanPhone.startsWith("+225") ? cleanPhone : `+225${cleanPhone}`;

      const { error } = await supabaseClient.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast.success("Connecté !");
      await checkMFAAndRedirect(navigate);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Code incorrect";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignup() {
    if (!email || !password) {
      toast.error("Remplissez tous les champs");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { role },
          emailRedirectTo: window.location.origin + "/app/home",
        },
      });
      if (error) throw error;
      toast.success("Compte créé ! Vérifiez votre email.");
      setStep("input");
      setMethod("email");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la création";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("input");
    setOtp("");
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col max-w-[430px] mx-auto">
      {/* Header Logo */}
      <div className="flex flex-col items-center pt-16 pb-8">
        <div className="flex items-center mb-1">
          <span className="text-3xl font-black tracking-tight text-gray-900">DÉPANN</span>
          <span className="text-3xl font-black text-orange-500">'GO</span>
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          San Pedro, Côte d'Ivoire
        </p>
      </div>

      <div className="px-6 flex-1 flex flex-col">

        {/* ═══════════ ÉTAPE : ENVOI OTP ═══════════ */}
        {step === "input" && (
          <>
            {/* Toggle Phone / Email */}
            <div className="bg-gray-200 p-1 rounded-2xl flex mb-6">
              {([
                { id: "phone" as AuthMethod, icon: Phone, label: "Téléphone" },
                { id: "email" as AuthMethod, icon: Mail, label: "Email" },
              ]).map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      active ? "bg-white text-orange-500 shadow-sm" : "text-gray-400"
                    }`}
                  >
                    <Icon size={16} />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {method === "phone" ? (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <span className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                      +225
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07 00 00 00 00"
                      className="w-full h-[52px] bg-white border border-gray-200 rounded-xl pl-24 pr-4 font-semibold text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 font-semibold">
                    Vous recevrez un code SMS de 6 chiffres
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      className="w-full h-[52px] bg-white border border-gray-200 rounded-xl pl-12 pr-4 font-semibold text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 font-semibold">
                    Un lien de connexion vous sera envoyé
                  </p>
                </div>
              )}

              <button
                onClick={handleSendOtp}
                disabled={!canSendOtp || loading}
                className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 mt-2"
                style={{ boxShadow: canSendOtp ? "0 4px 20px rgba(232,89,12,0.3)" : "none" }}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {method === "phone"
                  ? (loading ? "Envoi..." : "Recevoir le code SMS")
                  : (loading ? "Envoi..." : "Recevoir le lien par email")
                }
              </button>

              <button
                onClick={() => navigate("/app/onboarding")}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 py-3"
              >
                <ArrowLeft size={16} />
                Retour
              </button>
            </div>
          </>
        )}

        {/* ═══════════ ÉTAPE : VÉRIFICATION OTP ═══════════ */}
        {step === "otp" && (
          <>
            <button onClick={reset} className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-6">
              <ArrowLeft size={16} />
              Changer de numéro
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-orange-500" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Code de vérification</h2>
              <p className="text-sm text-gray-400 mt-2 font-semibold">
                Entrez le code à 6 chiffres envoyé au
              </p>
              <p className="text-sm font-bold text-gray-700 mt-1">
                +225 {phone.replace(/\s/g, "").replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full h-16 bg-white border border-gray-200 rounded-2xl text-center text-3xl font-black tracking-[0.5em] text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                autoFocus
              />

              <button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || loading}
                className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                style={{ boxShadow: otp.length === 6 ? "0 4px 20px rgba(232,89,12,0.3)" : "none" }}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Vérification..." : "Se connecter"}
              </button>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full text-center text-sm font-bold text-orange-500 py-3"
              >
                Renvoyer le code
              </button>
            </div>
          </>
        )}

        {/* ═══════════ ÉTAPE : INSCRIPTION EMAIL ═══════════ */}
        {step === "signup" && (
          <>
            <button onClick={reset} className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-6">
              <ArrowLeft size={16} />
              Retour
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-orange-500" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Créer votre compte</h2>
              <p className="text-sm text-gray-400 mt-2 font-semibold">
                {email} n'est pas encore inscrit
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe (min. 6 caractères)"
                  className="w-full h-[52px] bg-white border border-gray-200 rounded-xl pl-12 pr-12 font-semibold text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">
                Vous êtes :
              </p>

              <div className="space-y-3">
                {([
                  { id: "client" as const, icon: User, label: "Je cherche un réparateur", desc: "Trouvez un pro en 60 secondes" },
                  { id: "repairer" as const, icon: Wrench, label: "Je suis réparateur", desc: "Recevez des missions à San Pedro" },
                ]).map((r) => {
                  const Icon = r.icon;
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all active:scale-[0.98] ${
                        active ? "bg-orange-50 border-orange-500" : "bg-white border-gray-200"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        active ? "bg-orange-500" : "bg-orange-50"
                      }`}>
                        <Icon size={22} className={active ? "text-white" : "text-orange-500"} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{r.label}</p>
                        <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleEmailSignup}
                disabled={password.length < 6 || loading}
                className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 mt-4"
                style={{ boxShadow: password.length >= 6 ? "0 4px 20px rgba(232,89,12,0.3)" : "none" }}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Création..." : "Créer mon compte"}
              </button>

              <button
                onClick={() => { setStep("input"); setPassword(""); }}
                className="w-full text-center text-sm font-bold text-orange-500 py-3"
              >
                Utiliser un autre email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
