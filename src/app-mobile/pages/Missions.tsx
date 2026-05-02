import { useNavigate } from "react-router-dom";
import { ClipboardList, Search, Wrench, Plus, Clock, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { useAuthClient } from "../hooks/useAuthClient";
import { supabaseExt } from "@/lib/supabaseExternal";
import { useQuery } from "@tanstack/react-query";

type MissionStatus = "en_attente" | "acceptee" | "en_cours" | "terminee" | "annulee";

const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  en_attente:  { label: "En attente",  color: "text-amber-600",  bg: "bg-amber-50  border-amber-200",  icon: Clock },
  acceptee:    { label: "Acceptée",    color: "text-blue-600",   bg: "bg-blue-50   border-blue-200",   icon: CheckCircle },
  en_cours:    { label: "En cours",    color: "text-orange-600", bg: "bg-orange-50 border-orange-200", icon: Wrench },
  terminee:    { label: "Terminée",    color: "text-green-600",  bg: "bg-green-50  border-green-200",  icon: CheckCircle },
  annulee:     { label: "Annulée",     color: "text-red-500",    bg: "bg-red-50    border-red-200",    icon: XCircle },
};

const SERVICE_LABELS: Record<string, string> = {
  electricite: "Électricité", plomberie: "Plomberie",
  climatisation: "Climatisation", telephonie: "Téléphonie",
  informatique: "Informatique", electromenager: "Électroménager",
  menuiserie: "Menuiserie", peinture: "Peinture",
  serrurerie: "Serrurerie", moto: "Moto / Auto",
  maconnerie: "Maçonnerie", jardinage: "Jardinage",
};

export default function Missions() {
  const navigate = useNavigate();
  const { user } = useAuthClient();

  const { data: missions, isLoading } = useQuery({
    queryKey: ["missions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabaseExt
        .from("transactions")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const isEmpty = !isLoading && (!missions || missions.length === 0);

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col pb-24">

      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Mes missions</h1>
        <p className="text-gray-400 text-sm mt-1">Retrouvez l'historique de vos demandes.</p>
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="px-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {/* État vide */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center px-10 text-center py-12">
          {/* Illustration */}
          <div className="w-48 h-48 bg-orange-50 rounded-full flex items-center justify-center mb-8 relative">
            {/* Éléments flottants */}
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-bounce">
              <Search size={20} className="text-orange-500" />
            </div>
            <div className="absolute bottom-4 -left-4 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-pulse">
              <Wrench size={18} className="text-emerald-500" />
            </div>
            {/* Icône principale */}
            <ClipboardList size={72} className="text-orange-500/40" />
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-3">
            Aucune mission pour le moment
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-xs">
            Besoin d'un dépannage rapide ? Faites votre première demande et trouvez un pro en quelques minutes.
          </p>

          <button
            onClick={() => navigate("/app/nouvelle-demande")}
            className="w-full h-14 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform text-base"
            style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
          >
            Faire une demande
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* Liste des missions */}
      {!isLoading && missions && missions.length > 0 && (
        <div className="px-5 space-y-3">
          {missions.map((m: any) => {
            const status = (m.status ?? "en_attente") as MissionStatus;
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.en_attente;
            const StatusIcon = cfg.icon;
            const serviceLabel = SERVICE_LABELS[m.service_type] ?? m.service_type ?? "Service";
            const date = m.created_at
              ? new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
              : "—";
            const amount = m.total_amount_fcfa
              ? `${Number(m.total_amount_fcfa).toLocaleString("fr-FR")} FCFA`
              : "—";

            return (
              <button
                key={m.id}
                onClick={() => navigate(`/app/suivi/${m.id}`)}
                className="w-full bg-white rounded-3xl p-4 shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start gap-3">
                  {/* Icône service */}
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                    <Wrench size={20} />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-black text-gray-900 text-base truncate">{serviceLabel}</div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0 mt-0.5" />
                    </div>

                    {/* Description courte */}
                    {m.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{m.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      {/* Badge statut */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon size={11} />
                        {cfg.label}
                      </span>

                      {/* Montant + date */}
                      <div className="text-right">
                        <div className="text-xs font-black text-gray-900">{amount}</div>
                        <div className="text-[10px] text-gray-400">{date}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barre de progression pour missions en cours */}
                {(status === "en_cours" || status === "acceptee") && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                      <span>Progression</span>
                      <span>{status === "acceptee" ? "30%" : "65%"}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: status === "acceptee" ? "30%" : "65%" }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {/* Bouton nouvelle demande */}
          <button
            onClick={() => navigate("/app/nouvelle-demande")}
            className="w-full h-14 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform mt-4"
            style={{ boxShadow: "0 4px 20px rgba(232,89,12,0.3)" }}
          >
            Nouvelle demande
            <Plus size={20} />
          </button>
        </div>
      )}
    </div>
  );
}