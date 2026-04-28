import { useNavigate } from "react-router-dom";
import { User, Shield, Heart, HelpCircle, LogOut, ChevronRight, Phone, Mail, Star } from "lucide-react";
import { MobileShell } from "../MobileShell";
import { useAuthClient, signOut } from "../hooks/useAuthClient";
import { toast } from "sonner";

const SECTIONS = [
  {
    title: "Mon compte",
    items: [
      { icon: User, label: "Informations personnelles", desc: "Nom, téléphone, email" },
      { icon: Phone, label: "Changer de numéro", desc: "Modifier votre numéro CI" },
      { icon: Mail, label: "Changer d'email", desc: "Modifier votre adresse email" },
    ]
  },
  {
    title: "Sécurité",
    items: [
      { icon: Shield, label: "Mot de passe", desc: "Modifier votre mot de passe" },
      { icon: Shield, label: "Authentification", desc: "Gérer vos sessions actives" },
    ]
  },
  {
    title: "Favoris",
    items: [
      { icon: Heart, label: "Réparateurs favoris", desc: "Vos techniciens préférés" },
      { icon: Star, label: "Mes avis", desc: "Avis que vous avez laissés" },
    ]
  },
  {
    title: "Aide & Support",
    items: [
      { icon: HelpCircle, label: "Comment ça marche ?", desc: "Guide d'utilisation" },
      { icon: HelpCircle, label: "Contacter le support", desc: "Lun-Sam, 8h-18h" },
      { icon: HelpCircle, label: "Signaler un problème", desc: "Bugs et suggestions" },
    ]
  }
];

export default function Profil() {
  const { user } = useAuthClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success("Déconnecté");
    navigate("/app/onboarding");
  }

  const initials = user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <MobileShell>
      <div className="px-5 pt-6 pb-24">

        {/* Avatar + infos */}
        <div className="flex items-center gap-4 mb-6 bg-white rounded-2xl p-4 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-bold text-2xl">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-brand-navy text-lg">
              {user?.email?.split("@")[0] ?? "Mon compte"}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {user?.email ?? "Non connecté"}
            </div>
            <div className="mt-1 inline-flex items-center gap-1 bg-brand-success-soft text-brand-success text-xs font-semibold px-2 py-0.5 rounded-full">
              ● Compte actif
            </div>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </div>
            <div className="bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-gray-50">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors active:scale-[0.99]"
                    onClick={() => toast.info("Bientôt disponible", { description: item.label })}
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-primary-soft text-brand-primary flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-navy text-sm">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Déconnexion */}
        {user && (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-500 font-semibold mt-2"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        )}

        {/* Version */}
        <div className="text-center text-xs text-gray-400 mt-6">
          DÉPANN'GO v1.0 — San Pedro, Côte d'Ivoire
        </div>
      </div>
    </MobileShell>
  );
}