import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, MapPin, Car, House, Phone, MessageCircle, Map, XCircle, Clock, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabaseExt, pickName } from "@/lib/supabaseExternal";
import { toast } from "sonner";

type TimelineStep = {
  icon: typeof Check;
  label: string;
  sub: string;
  done: boolean;
  active: boolean;
};

function getTimeline(status: string): TimelineStep[] {
  const steps = [
    { key: "acceptee",  icon: Check,   label: "Demande acceptée",      sub: "Technicien confirmé" },
    { key: "en_route",  icon: MapPin,  label: "Technicien en route",   sub: "Arrivée estimée : 12 min" },
    { key: "en_cours",  icon: Wrench,  label: "Intervention",          sub: "Travaux en cours" },
    { key: "terminee",  icon: Check,   label: "Mission terminée",      sub: "Paiement final" },
  ];

  const order = ["en_attente", "acceptee", "en_route", "en_cours", "terminee"];
  const idx = order.indexOf(status);

  return steps.map((s, i) => ({
    ...s,
    done:   i < idx - 1,
    active: i === idx - 1,
  }));
}

export default function Suivi() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: mission, isLoading } = useQuery({
    queryKey: ["mission", id],
    queryFn: async () => {
      const { data } = await supabaseExt
        .from("transactions")
        .select("*, repairers(*), profiles(*)")
        .eq("id", id)
        .single();
      return data;
    },
    enabled: !!id,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = mission?.status ?? "en_attente";
  const timeline = getTimeline(status);
  const techName = mission?.repairers
    ? pickName(mission.repairers as any)
    : "Technicien assigné";
  const techRating = Number((mission?.repairers as any)?.average_rating ?? 4.8);
  const techMissions = Number((mission?.repairers as any)?.total_missions ?? 0);
  const serviceLabel = mission?.service_type ?? "Service";
  const missionId = id?.slice(0, 8).toUpperCase() ?? "—";

  async function handleCancel() {
    if (!id) return;
    const { error } = await supabaseExt
      .from("transactions")
      .update({ status: "annulee" })
      .eq("id", id);
    if (error) {
      toast.error("Impossible d'annuler");
    } else {
      toast.success("Mission annulée");
      navigate("/app/missions");
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col pb-10">

      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-black text-gray-900">Suivi de Mission</h1>
      </header>

      {/* Card Mission + Timeline */}
      <div className="px-5 mt-2">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">

          {/* Déco background */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-50 rounded-full" />

          {/* Top row */}
          <div className="flex items-start justify-between mb-6 relative z-10">
            <div>
              <span className="px-3 py-1 bg-orange-50 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                {status === "terminee" ? "Terminée" :
                 status === "annulee"  ? "Annulée"  :
                 status === "en_cours" ? "En cours" : "En route"}
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-2 capitalize">{serviceLabel}</h2>
              <p className="text-xs text-gray-400 mt-0.5">ID : #DP-{missionId}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center font-black text-2xl border-2 border-orange-200 shrink-0">
              {techName.charAt(0)}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-5 relative">
            {/* Ligne verticale */}
            <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-100" />

            {timeline.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex gap-4 relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 ${
                    step.done
                      ? "bg-orange-500"
                      : step.active
                      ? "bg-orange-500 shadow-[0_0_0_4px_rgba(232,89,12,0.12)]"
                      : "bg-gray-100"
                  }`}>
                    {step.done || step.active
                      ? <Icon size={12} className="text-white" />
                      : <div className="w-2 h-2 rounded-full bg-gray-300" />
                    }
                  </div>
                  <div className={`flex-1 ${!step.done && !step.active ? "opacity-40" : ""}`}>
                    <p className="text-sm font-bold text-gray-900">{step.label}</p>
                    <p className={`text-[11px] mt-0.5 font-medium ${
                      step.active ? "text-orange-500 animate-pulse" : "text-gray-400"
                    }`}>
                      {step.active && step.label === "Technicien en route"
                        ? "Arrivée estimée : 12 min"
                        : step.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Technicien */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-black text-lg shrink-0">
              {techName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{techName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-yellow-400 text-xs">★</span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {techRating.toFixed(1)} ({techMissions} missions)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.info("Appel disponible bientôt")}
              className="w-11 h-11 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <Phone size={18} />
            </button>
            <button
              onClick={() => toast.info("Chat disponible bientôt")}
              className="w-11 h-11 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <MessageCircle size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Carte stylisée */}
      <div className="px-5 mt-4">
        <div className="w-full h-48 bg-orange-50 rounded-3xl border border-orange-100 relative overflow-hidden flex items-center justify-center">
          <Map size={80} className="text-gray-200" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

          {/* Marqueur technicien animé */}
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-10 h-10 bg-orange-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-bounce">
              <Car size={18} className="text-white" />
            </div>
            <div className="mt-1 px-2 py-0.5 bg-white rounded-md shadow-sm text-[8px] font-black text-gray-900">
              {techName.split(" ")[0].toUpperCase()}
            </div>
          </div>

          {/* Marqueur destination */}
          <div className="absolute top-1/4 right-1/4 flex flex-col items-center">
            <div className="w-8 h-8 bg-gray-900 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
              <House size={14} className="text-white" />
            </div>
          </div>

          {/* ETA badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <Clock size={12} className="text-orange-500" />
            <span className="text-xs font-black text-gray-900">Arrivée dans 12 min</span>
          </div>
        </div>
      </div>

      {/* Bouton annuler */}
      {status !== "terminee" && status !== "annulee" && (
        <div className="px-5 mt-5">
          <button
            onClick={handleCancel}
            className="w-full h-14 bg-white border border-red-200 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform text-sm"
          >
            <XCircle size={18} />
            Annuler la mission
          </button>
        </div>
      )}
    </div>
  );
}