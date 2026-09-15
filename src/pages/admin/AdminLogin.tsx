import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabaseClient";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = import.meta.env.VITE_SUPABASE_ADMIN_EMAIL;

  async function handleLogin() {
    if (!email || !password) {
      toast.error("Remplissez tous les champs");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (ADMIN_EMAIL && data.user.email !== ADMIN_EMAIL) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("is_admin")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.is_admin !== true) {
          await supabaseClient.auth.signOut();
          toast.error("Accès refusé", { description: "Vous n'avez pas les droits administrateur." });
          return;
        }
      }

      // Vérifier si la 2FA est activée pour cet admin
      try {
        const { data: mfaData } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
        const hasEnrolled = (mfaData?.factors ?? []).some(
          (f) => f.factor_type === "totp" && f.status === "verified"
        );
        if (hasEnrolled && mfaData?.currentLevel === "aal1") {
          toast.info("Vérification en deux étapes requise");
          // Rediriger vers le MFA challenge de l'app mobile (partage la même session)
          navigate("/app/mfa/challenge", { replace: true });
          return;
        }
      } catch {
        // Ignorer — continuer vers le dashboard
      }

      toast.success("Bienvenue, Administrateur !");
      navigate("/");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Identifiants incorrects";
      toast.error("Erreur de connexion", { description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-brand-primary" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Administration</h1>
          <p className="text-sm text-gray-400 mt-2 font-semibold">Dépann'Go — Panneau de contrôle</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email administrateur"
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 font-semibold text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-12 font-semibold text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              type="button"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 bg-brand-primary text-white font-black rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6 font-semibold">
          Accès restreint aux administrateurs autorisés
        </p>
      </div>
    </div>
  );
}
