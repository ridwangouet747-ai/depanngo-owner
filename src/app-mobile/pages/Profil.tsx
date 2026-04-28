import { useNavigate } from "react-router-dom";
import { LogOut, ChevronRight, Phone, ShieldCheck, Heart, HelpCircle } from "lucide-react";
import { MobileShell } from "../MobileShell";
import { useAuthClient, signOut } from "../hooks/useAuthClient";

export default function Profil() {
  const navigate = useNavigate();
  const { user } = useAuthClient();

  return (
    <MobileShell>
      <div className="px-5 pt-6">
        <div className="bg-gradient-to-br from-brand-navy to-brand-navy/80 text-white rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-bold text-2xl">
              {(user?.phone ?? "U").slice(-2)}
            </div>
            <div>
              <div className="font-bold text-lg">Mon compte</div>
              <div className="text-sm opacity-80 flex items-center gap-1.5"><Phone size={12} /> {user?.phone ?? "Non connecté"}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Item icon={ShieldCheck} label="Sécurité" />
          <Item icon={Heart} label="Favoris" />
          <Item icon={HelpCircle} label="Aide & support" />
        </div>

        {user && (
          <button
            onClick={async () => { await signOut(); navigate("/app/onboarding"); }}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-danger-soft text-brand-danger font-semibold"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        )}
      </div>
    </MobileShell>
  );
}

function Item({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl shadow-card text-left">
      <div className="w-10 h-10 rounded-xl bg-brand-primary-soft text-brand-primary flex items-center justify-center">
        <Icon size={18} />
      </div>
      <span className="flex-1 font-semibold text-brand-navy text-sm">{label}</span>
      <ChevronRight size={18} className="text-gray-400" />
    </button>
  );
}
