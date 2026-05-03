import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useAuthClient } from "../../hooks/useAuthClient";

interface Mission {
  id: string;
  service_type: string;
  description: string;
  intervention_quartier: string;
  urgency_level: string;
  total_amount_fcfa: number;
  status: string;
  created_at: string;
}

export default function ProMissions() {
  const navigate = useNavigate();
  const { user } = useAuthClient();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"disponibles" | "en_cours" | "terminees">("disponibles");

  useEffect(() => {
    loadMissions();
  }, [tab]);

  async function loadMissions() {
    setLoading(true);
    try {
      let query = supabaseClient
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (tab === "disponibles") {
        query = query.eq("status", "requested");
      } else if (tab === "en_cours") {
        query = query.eq("status", "in_progress");
      } else {
        query = query.eq("status", "completed");
      }

      const { data } = await query.limit(20);
      setMissions((data as Mission[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function acceptMission(id: string) {
    await supabaseClient
      .from("transactions")
      .update({ status: "accepted", repairer_id: user?.id })
      .eq("id", id);
    loadMissions();
  }

  async function refuseMission(id: string) {
    await supabaseClient
      .from("transactions")
      .update({ status: "cancelled" })
      .eq("id", id);
    loadMissions();
  }

  const TABS = [
    { id: "disponibles", label: "Disponibles" },
    { id: "en_cours",    label: "En cours" },
    { id: "terminees",   label: "Terminées" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">

      {/* Header */}
      <header className="px-5 pt-6 pb-4 bg-[#F5F5F5] sticky top-0 z-40">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Mes Missions</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === t.id
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Liste */}
      <div className="px-5 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))
        ) : missions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-bold text-gray-900">Aucune mission {tab}</p>
            <p className="text-sm text-gray-400 mt-1">
              {tab === "disponibles"
                ? "Activez votre disponibilité pour recevoir des missions"
                : "Vos missions apparaîtront ici"}
            </p>
          </div>
        ) : (
          missions.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className="font-black text-gray-900">{m.service_type ?? "Service"}</span>
                  <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                    <MapPin size={11} className="text-orange-500" />
                    <span>{m.intervention_quartier ?? "San Pedro"}</span>
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
                  ~{(m.total_amount_fcfa ?? 0).toLocaleString()} FCFA
                </span>
                {tab === "disponibles" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => refuseMission(m.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold"
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
                ) : (
                  <button
                    onClick={() => navigate(`/pro/missions/${m.id}`)}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold"
                  >
                    Détails <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}