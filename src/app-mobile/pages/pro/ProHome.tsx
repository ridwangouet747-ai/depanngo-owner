import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Bell, TrendingUp, Clock, CheckCircle, XCircle, MapPin, Star, ChevronRight } from "lucide-react";
import { useAuthClient } from "../../hooks/useAuthClient";
import { supabaseExt } from "@/lib/supabaseExternal";
import ProBottomNav from "./ProBottomNav";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ProHome() {
  const navigate = useNavigate();
  const { user } = useAuthClient();
  const [isAvailable, setIsAvailable] = useState(true);
  const [toggling, setToggling] = useState(false);
  const qc = useQueryClient();

  const { data: missions, isLoading } = useQuery({
    queryKey: ["pro-missions-dispo"],
    queryFn: async () => {
      const { data } = await supabaseExt
        .from("transactions")
        .select("*")
        .eq("status", "requested")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    refetchInterval: 20000,
  });

  // Temps réel — nouvelles missions
  useEffect(() => {
    const channel = supabaseExt
      .channel("pro-new-missions")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "transactions",
      }, (payload) => {
        toast("🔧 Nouvelle mission disponible !", {
          description: `${(payload.new as any).service_type} — ${(payload.new as any).intervention_quartier}`,
          action: { label: "Voir", onClick: () => navigate("/pro/missions") },
        });
        qc.invalidateQueries({ queryKey: ["pro-missions-dispo"] });
      })
      .subscribe();
    return () => { supabaseExt.removeChannel(channel); };
  }, []);

  async function toggleAvailability() {
    setToggling(true);
    try {
      await supabaseExt
        .from("repairers")
        .update({ is_available: !isAvailable })
        .eq("user_id", user?.id);
      setIsAvailable(!isAvailable);
      toast.success(isAvailable ? "Vous êtes maintenant indisponible" : "Vous êtes maintenant disponible");
    } finally {
      setToggling(false);
    }
  }

  async function acceptMission(id: string) {
    await supabaseExt.from("transactions").update({ status: "accepted", repairer_id: user?.id }).eq("id", id);
    toast.success("Mission acceptée !");
    qc.invalidateQueries({ queryKey: ["pro-missions-dispo"] });
  }

  async function refuseMission(id: string) {
    await supabaseExt.from("transactions").update({ status: "cancelled" }).eq("id", id);
    toast.success("Mission refusée");
    qc.invalidateQueries({ queryKey: ["pro-missions-dispo"] });
  }

  const STATS = [
    { label: "Missions", value: "0",      icon: Wrench,    color: "text-orange-500 bg-orange-50" },
    { label: "Note",     value: "—",       icon: Star,      color: "text-amber-500  bg-amber-50"  },
    { label: "Revenus",  value: "0 FCFA",  icon: TrendingUp, color: "text-green-500 bg-green-50"  },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">

      {/* Header orange */}
      <div className="bg-orange-500 px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-orange-100 text-sm font-medium">Espace Réparateur</p>
            <h1 className="text-white text-2xl font-black mt-0.5">
              {user?.email?.split("@")[0] ?? "Mon espace"}
            </h1>
          </div>
          <button className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center relative">
            <Bell size={20} className="text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
          </button>
        </div>

        {/* Toggle disponibilité */}
        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-lg">
              {isAvailable ? "🟢 Disponible" : "🔴 Indisponible"}
            </p>
            <p className="text-orange-100 text-xs mt-0.5">
              {isAvailable ? "Vous recevez des missions" : "Vous ne recevez pas de missions"}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`relative w-16 h-8 rounded-full transition-all ${
              isAvailable ? "bg-green-400" : "bg-white/30"
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
              isAvailable ? "left-9" : "left-1"
            }`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-3 divide-x divide-gray-100">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex flex-col items-center gap-1 px-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon size={16} />
                </div>
                <span className="font-black text-gray-900 text-sm">{s.value}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missions disponibles */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900 text-lg">Missions disponibles</h2>
          <button
            onClick={() => navigate("/pro/missions")}
            className="text-orange-500 text-sm font-bold flex items-center gap-1"
          >
            Voir tout <ChevronRight size={14} />
          </button>
        </div>

        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse mb-3" />
          ))
        ) : (missions ?? []).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-bold text-gray-900">Aucune mission disponible</p>
            <p className="text-sm text-gray-400 mt-1">
              Activez votre disponibilité pour recevoir des missions
            </p>
          </div>
        ) : (
          (missions ?? []).map((m: any) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-black text-gray-900">{m.service_type ?? "Service"}</span>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                    <MapPin size={11} className="text-orange-500" />
                    <span>{m.intervention_quartier ?? "San Pedro"}</span>
                    <span>•</span>
                    <Clock size={11} />
                    <span>{new Date(m.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                  m.urgency_level === "critique"
                    ? "bg-red-100 text-red-600"
                    : m.urgency_level === "moyen"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-green-100 text-green-600"
                }`}>
                  {m.urgency_level === "critique" ? "🔴" : m.urgency_level === "moyen" ? "🟡" : "🟢"} {m.urgency_level ?? "Normal"}
                </span>
              </div>

              {m.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{m.description}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="font-black text-orange-500 text-sm">
                  ~{(m.total_amount_fcfa ?? 0).toLocaleString("fr-FR")} FCFA
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => refuseMission(m.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold border border-red-100"
                  >
                    <XCircle size={14} /> Refuser
                  </button>
                  <button
                    onClick={() => acceptMission(m.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold"
                  >
                    <CheckCircle size={14} /> Accepter
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <ProBottomNav />
    </div>
  );
}