import { ListChecks } from "lucide-react";
import { MobileShell } from "../MobileShell";

export default function Missions() {
  return (
    <MobileShell>
      <div className="px-5 pt-6">
        <h1 className="text-xl font-bold text-brand-navy mb-1">Mes missions</h1>
        <p className="text-sm text-gray-500 mb-6">Retrouvez ici vos demandes en cours et passées.</p>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary-soft text-brand-primary flex items-center justify-center mb-3">
            <ListChecks size={28} />
          </div>
          <div className="font-semibold text-brand-navy">Aucune mission pour le moment</div>
          <div className="text-sm text-gray-500 mt-1">Lancez votre première demande depuis l'accueil.</div>
        </div>
      </div>
    </MobileShell>
  );
}
