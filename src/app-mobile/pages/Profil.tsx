import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, Lock, ShieldCheck, Star, LogOut, ChevronRight, Pencil } from "lucide-react";
import { useAuthClient, signOut } from "../hooks/useAuthClient";
import { toast } from "sonner";

const SECTIONS = [
  {
    title: "Mon Compte",
    items: [
      { icon: User,       label: "Infos personnelles", desc: "Nom, téléphone, email" },
      { icon: Phone,      label: "Changer de numéro",  desc: undefined },
      { icon: Mail,       label: "Changer d'email",    desc: undefined },
    ],
  },
  {
    title: "Sécurité",
    items: [
      { icon: Lock,        label: "Mot de passe",      desc: undefined },
      { icon: ShieldCheck, label: "Authentification",  desc: undefined },
    ],
  },
  {
    title: "Favoris",
    items: [
      { icon: Star, label: "Réparateurs favoris", desc: undefined },
    ],
  },
];

export default function Profil() {
  const { user } = useAuthClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success("Déconnecté");
    navigate("/app/onboarding");
  }

  const displayName = user?.email?.split("@")[0] ?? "Mon compte";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col pb-24">

      {/* Header Profil */}
      <header className="px-5 pt-8 pb-6 bg-white border-b border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-black text-3xl border-2 border-orange-500">
              {initials}
            </div>
            {/* Badge actif */}
            <div className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          {/* Nom + statut */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-900 truncate">{displayName}</h1>
            <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email ?? ""}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">
                Compte actif
              </span>
            </div>
          </div>

          {/* Bouton éditer */}
          <button
            onClick={() => toast.info("Bientôt disponible")}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full"
          >
            <Pencil size={16} className="text-gray-600" />
          </button>
        </div>
      </header>

      {/* Sections */}
      <div className="px-5 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
              {section.title}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {section.items.map((item, i) => {
                const Icon = item.icon;
                const isLast = i === section.items.length - 1;
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toast.info("Bientôt disponible", { description: item.label })}
                      className="w-full p-4 flex items-center justify-between active:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                          <Icon size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-900">{item.label}</p>
                          {item.desc && (
                            <p className="text-[11px] text-gray-400">{item.desc}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-gray-300 group-hover:translate-x-0.5 transition-transform shrink-0"
                      />
                    </button>
                    {!isLast && <div className="h-px bg-gray-100 mx-4" />}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Déconnexion */}
        {user && (
          <button
            onClick={handleSignOut}
            className="w-full h-14 bg-red-50 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform border border-red-100 text-sm"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        )}

        {/* Version */}
        <p className="text-center text-xs text-gray-300 pb-4">
          DÉPANN'GO v1.0 — San Pedro, Côte d'Ivoire
        </p>
      </div>
    </div>
  );
}