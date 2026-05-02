import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabaseClient";
import { supabaseExt } from "@/lib/supabaseExternal";

type Mode = "login" | "signup";
type Role = "client" | "repairer";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("client");
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      toast.error("Remplissez tous les champs");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenue !");
        navigate("/app/home");
      } else {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabaseExt.from("profiles").upsert({
            id: data.user.id,
            email,
            role,
            phone: "",
            full_name: email.split("@")[0],
          }, { onConflict: "id" });
        }
        toast.success("Compte créé !");
        navigate("/app/home");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
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

        {/* Toggle Connexion / Inscription */}
        <div className="bg-gray-200 p-1 rounded-2xl flex mb-8">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                mode === m
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              {m === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        {/* Formulaire Connexion */}
        {mode === "login" && (
          <div className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full h-[52px] bg-white border border-gray-200 rounded-xl pl-12 pr-4 font-semibold text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full h-[52px] bg-white border border-gray-200 rounded-xl pl-12 pr-12 font-semibold text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Bouton */}
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 mt-2"
              style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            <p className="text-center text-sm font-semibold text-gray-400 pt-4">
              Pas encore de compte ?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-orange-500 font-bold"
              >
                S'inscrire
              </button>
            </p>
          </div>
        )}

        {/* Formulaire Inscription */}
        {mode === "signup" && (
          <div className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full h-[52px] bg-white border border-gray-200 rounded-xl pl-12 pr-4 font-semibold text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full h-[52px] bg-white border border-gray-200 rounded-xl pl-12 pr-12 font-semibold text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Choix du rôle */}
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">
              Vous êtes :
            </p>

            <div className="space-y-3">
              {([
                {
                  id: "client" as Role,
                  icon: User,
                  label: "Je cherche un réparateur",
                  desc: "Trouvez un pro en 60 secondes",
                },
                {
                  id: "repairer" as Role,
                  icon: Wrench,
                  label: "Je suis réparateur",
                  desc: "Recevez des missions à San Pedro",
                },
              ]).map((r) => {
                const Icon = r.icon;
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all active:scale-[0.98] ${
                      active
                        ? "bg-orange-50 border-orange-500"
                        : "bg-white border-gray-200"
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

            {/* Bouton */}
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full h-14 bg-orange-500 text-white font-black rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 mt-4"
              style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Création..." : "Créer mon compte"}
            </button>

            <p className="text-center text-sm font-semibold text-gray-400 pt-4">
              Déjà inscrit ?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-orange-500 font-bold"
              >
                Se connecter
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}