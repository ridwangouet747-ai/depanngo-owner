import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "../MobileShell";
import { supabaseClient } from "@/lib/supabaseClient";

type Step = "phone" | "otp" | "role";

export default function Auth() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<"client" | "repairer">("client");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fullPhone = phone.startsWith("+") ? phone : `+225${phone.replace(/\D/g, "")}`;

  async function sendOtp() {
    if (phone.replace(/\D/g, "").length < 8) {
      toast.error("Numéro invalide");
      return;
    }
    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (error) {
      toast.error("Envoi du code impossible", { description: error.message });
      return;
    }
    toast.success("Code envoyé par SMS");
    setStep("otp");
  }

  async function verifyOtp() {
    if (otp.length < 4) return;
    setLoading(true);
    const { error } = await supabaseClient.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error("Code incorrect", { description: error.message });
      return;
    }
    setStep("role");
  }

  async function finishRole() {
    setLoading(true);
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
      await supabaseClient
        .from("profiles")
        .upsert({ id: user.id, phone: fullPhone, role }, { onConflict: "id" });
    }
    setLoading(false);
    toast.success("Bienvenue sur DÉPANN'GO !");
    navigate("/app/home");
  }

  return (
    <MobileShell noBottomPad>
      <div className="flex flex-col min-h-screen p-6">
        <button
          onClick={() => (step === "phone" ? navigate("/app/onboarding") : setStep("phone"))}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4"
        >
          <ArrowLeft size={18} />
        </button>

        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
          {step === "phone" && (
            <>
              <h1 className="text-2xl font-bold text-brand-navy mb-2">Votre numéro</h1>
              <p className="text-gray-500 mb-8 text-sm">Nous vous enverrons un code par SMS pour vérifier votre identité.</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">+225</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone.replace("+225", "")}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07 00 00 00 00"
                  className="w-full pl-16 pr-4 py-4 rounded-2xl bg-white border border-border text-lg font-medium focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
                  autoFocus
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full mt-8 bg-brand-primary text-white font-semibold py-4 rounded-2xl shadow-glow-primary flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Recevoir le code"}
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <h1 className="text-2xl font-bold text-brand-navy mb-2">Code de vérification</h1>
              <p className="text-gray-500 mb-8 text-sm">Entrez le code à 6 chiffres envoyé au {fullPhone}.</p>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full text-center tracking-[0.6em] text-2xl font-bold py-4 rounded-2xl bg-white border border-border focus:ring-2 focus:ring-brand-primary outline-none"
                autoFocus
              />
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full mt-8 bg-brand-primary text-white font-semibold py-4 rounded-2xl shadow-glow-primary disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Vérifier"}
              </button>
              <button onClick={sendOtp} className="w-full mt-3 text-sm text-gray-500">
                Renvoyer le code
              </button>
            </>
          )}

          {step === "role" && (
            <>
              <h1 className="text-2xl font-bold text-brand-navy mb-2">Vous êtes ?</h1>
              <p className="text-gray-500 mb-8 text-sm">Choisissez le profil qui vous correspond.</p>
              <div className="space-y-3">
                {(["client", "repairer"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                      role === r ? "border-brand-primary bg-brand-primary-soft" : "border-border bg-white"
                    }`}
                  >
                    <div className="font-semibold text-brand-navy">
                      {r === "client" ? "Je cherche un réparateur" : "Je suis réparateur"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {r === "client" ? "Trouvez un pro vérifié près de chez vous" : "Recevez des missions à San Pedro"}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={finishRole}
                disabled={loading}
                className="w-full mt-8 bg-brand-primary text-white font-semibold py-4 rounded-2xl shadow-glow-primary disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Continuer"}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </MobileShell>
  );
}
