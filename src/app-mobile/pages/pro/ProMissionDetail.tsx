import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
  PlayCircle,
  User,
  Wrench,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatFCFA, pickName, supabaseExt } from "@/lib/supabaseExternal";
import ProBottomNav from "./ProBottomNav";

type MissionStep = {
  status: "accepted" | "in_progress" | "completed";
  label: string;
  description: string;
  icon: typeof CheckCircle;
};

type MissionRecord = Record<string, unknown> & {
  id: string;
  status?: string | null;
  profiles?: Record<string, unknown> | null;
  service_type?: string | null;
  intervention_quartier?: string | null;
  total_amount_fcfa?: number | null;
  description?: string | null;
  created_at?: string | null;
};

const STEPS: MissionStep[] = [
  {
    status: "accepted",
    label: "En route",
    description: "Mission acceptée, déplacement vers le client",
    icon: MapPin,
  },
  {
    status: "in_progress",
    label: "Intervention en cours",
    description: "Le diagnostic ou la réparation est lancé",
    icon: Wrench,
  },
  {
    status: "completed",
    label: "Clôturée",
    description: "Mission terminée et prête pour validation",
    icon: CheckCircle,
  },
];

function stepIndex(status?: string | null) {
  if (status === "completed") return 2;
  if (status === "in_progress") return 1;
  if (status === "accepted") return 0;
  return -1;
}

function nextStatus(status?: string | null) {
  if (status === "in_progress") return "completed";
  if (status === "accepted") return "in_progress";
  return "accepted";
}

function actionLabel(status?: string | null) {
  if (status === "completed") return "Mission clôturée";
  if (status === "in_progress") return "Clôturer la mission";
  if (status === "accepted") return "Démarrer l'intervention";
  return "Marquer en route";
}

export default function ProMissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);

  const { data: mission, isLoading } = useQuery<MissionRecord>({
    queryKey: ["pro-mission-detail", id],
    enabled: !!id,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabaseExt
        .from("transactions")
        .select("*, repairers(*), profiles(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as MissionRecord;
    },
  });

  const currentIndex = stepIndex(mission?.status);
  const clientName = useMemo(() => {
    if (mission?.profiles) return pickName(mission.profiles, "Client");
    return "Client";
  }, [mission]);

  async function updateMissionStatus() {
    if (!id || mission?.status === "completed") return;

    const status = nextStatus(mission?.status);
    const patch: Record<string, string> = { status };

    if (status === "completed") {
      patch.completed_at = new Date().toISOString();
    }

    setUpdating(true);
    try {
      const { error } = await supabaseExt
        .from("transactions")
        .update(patch)
        .eq("id", id);

      if (error) throw error;
      toast.success("Statut de mission mis à jour");
      queryClient.invalidateQueries({ queryKey: ["pro-mission-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["pro-missions"] });
    } catch {
      toast.error("Impossible de mettre à jour la mission");
    } finally {
      setUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-5">
        <div className="bg-white rounded-3xl p-6 text-center border border-gray-100">
          <h1 className="text-lg font-black text-gray-900">Mission introuvable</h1>
          <button
            onClick={() => navigate("/app/pro/missions")}
            className="mt-4 h-12 px-5 bg-orange-500 text-white font-black rounded-2xl"
          >
            Retour aux missions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-28">
      <header className="px-5 pt-6 pb-4 bg-[#F5F5F5] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Détail mission</h1>
            <p className="text-xs text-gray-400 font-bold mt-0.5">
              #{String(mission.id).slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-4">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex px-3 py-1 bg-orange-50 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                {actionLabel(mission.status)}
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-3">
                {mission.service_type ?? "Service"}
              </h2>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold mt-1">
                <MapPin size={13} className="text-orange-500" />
                <span>{mission.intervention_quartier ?? "San Pedro"}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-black uppercase">Montant</p>
              <p className="text-orange-500 font-black mt-1">
                {formatFCFA(mission.total_amount_fcfa)}
              </p>
            </div>
          </div>

          {mission.description && (
            <p className="text-sm text-gray-500 leading-relaxed mt-4">
              {mission.description}
            </p>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-900 mb-5">Progression</h3>
          <div className="space-y-5 relative">
            <div className="absolute left-[17px] top-5 bottom-5 w-0.5 bg-gray-100" />
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const done = currentIndex >= index;
              const active = currentIndex === index;

              return (
                <div key={step.status} className="flex gap-4 relative">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 ${
                      done
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-300"
                    } ${active ? "shadow-[0_0_0_5px_rgba(232,89,12,0.12)]" : ""}`}
                  >
                    <Icon size={17} />
                  </div>
                  <div className={!done ? "opacity-45" : ""}>
                    <p className="text-sm font-black text-gray-900">{step.label}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="w-9 h-9 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-3">
              <User size={17} />
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase">Client</p>
            <p className="text-sm font-black text-gray-900 mt-1 truncate">{clientName}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="w-9 h-9 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-3">
              <Clock size={17} />
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase">Créée le</p>
            <p className="text-sm font-black text-gray-900 mt-1">
              {new Date(mission.created_at ?? Date.now()).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/app/messages/${mission.id}`)}
            className="w-14 h-14 bg-white text-orange-500 rounded-2xl border border-orange-200 flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            <MessageCircle size={22} />
          </button>
          <button
            onClick={updateMissionStatus}
            disabled={updating || mission.status === "completed"}
            className="flex-1 h-14 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 disabled:bg-gray-300 active:scale-95 transition-transform"
          >
            {mission.status === "completed" ? <CheckCircle size={19} /> : <PlayCircle size={19} />}
            {actionLabel(mission.status)}
          </button>
        </div>
      </main>

      <ProBottomNav />
    </div>
  );
}
