import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Wrench, TrendingUp, Edit, LogOut, Shield, ChevronRight } from "lucide-react";
import { useAuthClient, signOut } from "../../hooks/useAuthClient";
import { toast } from "sonner";

export default function ProProfil() {
  const navigate = useNavigate();
  const { user } = useAuthClient();

  async function handleSignOut() {
    await signOut();
    toast.success("Déconnecté");
    navigate("/app/onboarding");
  }

  const initials = user?.email?.charAt(0).toUpperCase() ?? "R";

  const SECTIONS = [
    {
      title: "Mon profil",
      items: [
        { icon: Edit,    label: "Modifier mes informations", desc: "Nom, téléphone, bio" },
        { icon: Wrench,  label: "Mes spécialités",           desc: "Gérer vos domaines d'expertise" },
      ]
    },
    {
      title: "Vérification",
      items: [
        { icon: Shield,  label: "Ma CNI",                    desc: "Statut de vérification" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">

      {/* Header */}
      <div className="bg-orange-500 px-5 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h1 className="text-white text-2xl font-black">Mon Profil</h1>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/20 text-white flex items-center justify-center font-black text-3xl border-2 border-white/30">
            {initials}
          </div>
          <div>
            <p className="text-white font-black text-xl">
              {user?.email?.split("@")[0] ?? "Réparateur"}
            </p>
            <p className="text-orange-100 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ⚙️ Réparateur
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: "Missions", value: "0", icon: Wrench },
            { label: "Note",     value: "—", icon: Star },
            { label: "Trust",    value: "100", icon: TrendingUp },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex flex-col items-center gap-1 px-2">
                <Icon size={16} className="text-orange-500" />
                <span className="font-black text-gray-900 text-sm">{s.value}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sections */}
      <div className="px-5 mt-6 space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => toast.info("Bientôt disponible")}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Déconnexion */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-500 font-bold border border-red-100"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>

        <p className="text-center text-xs text-gray-400">
          DÉPANN'GO Réparateur v1.0 — San Pedro
        </p>
      </div>
    </div>
  );
}