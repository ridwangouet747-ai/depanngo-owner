import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabaseClient";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email || !email.includes("@")) {
      toast.error("Entrez une adresse email valide");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/app/auth",
      });
      if (error) throw error;
      setSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'envoi";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col max-w-[430px] mx-auto">
      <div className="flex flex-col items-center pt-16 pb-8">
        <div className="flex items-center mb-1">
          <span className="text-3xl font-black tracking-tight text-gray-900">DÉPANN</span>
          <span className="text-3xl font-black text-orange-500">'GO</span>
        </div>
      </div>

      <div className="px-6 flex-1 flex flex-col">
        <button
          onClick={() => navigate("/app/auth")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-6"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </button>

        {!sent ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-orange-500" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Mot de passe oublié</h2>
              <p className="text-sm text-gray-400 mt-2 font-semibold leading-relaxed">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  className="w-full h-[52px] bg-white border border-gray-200 rounded-xl pl-12 pr-4 font-semibold text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                />
              </div>

              <button
                onClick={handleReset}
                disabled={!email.includes("@") || loading}
                className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                style={{ boxShadow: email.includes("@") ? "0 4px 20px rgba(232,89,12,0.3)" : "none" }}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center pt-12">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-3">Email envoyé !</h2>
            <p className="text-sm text-gray-400 font-semibold leading-relaxed mb-8">
              Un lien de réinitialisation a été envoyé à<br />
              <span className="text-gray-700 font-bold">{email}</span>
              <br /><br />
              Vérifiez votre boîte de réception et suivez les instructions.
            </p>
            <button
              onClick={() => navigate("/app/auth")}
              className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
