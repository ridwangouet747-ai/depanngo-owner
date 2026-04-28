import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Shield, MapPin, Award, CheckCircle2 } from "lucide-react";
import { MobileShell } from "../MobileShell";
import { useRepairer } from "../hooks/useRepairers";
import { pickName } from "@/lib/supabaseExternal";

export default function ReparateurProfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: r, isLoading } = useRepairer(id);

  if (isLoading) {
    return (
      <MobileShell>
        <div className="p-5 space-y-3">
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-6 bg-gray-100 rounded animate-pulse w-1/2" />
          <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </MobileShell>
    );
  }

  if (!r) {
    return (
      <MobileShell>
        <div className="p-5 text-center text-gray-500">Réparateur introuvable.</div>
      </MobileShell>
    );
  }

  const trust = Number((r as any).trust_score ?? 75);
  const rating = Number((r as any).average_rating ?? r.rating ?? 4.5);
  const missions = Number((r as any).total_missions ?? r.repair_count ?? 0);
  const trustColor = trust >= 80 ? "bg-brand-success" : trust >= 50 ? "bg-brand-warning" : "bg-brand-danger";
  const specialties = Array.isArray((r as any).specialties)
    ? (r as any).specialties
    : [(r as any).specialty || "Technicien"];

  return (
    <MobileShell>
      {/* Header */}
      <div className="relative bg-gradient-to-br from-brand-navy to-brand-navy/80 text-white px-5 pt-4 pb-8 rounded-b-3xl">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-4 mt-4">
          <div className="w-20 h-20 rounded-3xl bg-brand-primary text-white flex items-center justify-center font-bold text-3xl">
            {pickName(r as any).charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-bold text-xl truncate">{pickName(r as any)}</div>
              {trust >= 80 && <CheckCircle2 size={16} className="text-brand-primary fill-white" />}
            </div>
            <div className="text-sm opacity-80 truncate">{specialties.join(" · ")}</div>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="flex items-center gap-1">
                <Star size={12} className="fill-brand-warning text-brand-warning" /> {rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1 opacity-80">
                <MapPin size={11} /> {(r as any).quartier ?? "San Pedro"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4 -mt-4">
        {/* Trust Score */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-brand-navy" />
              <span className="font-semibold text-sm text-brand-navy">Trust Score</span>
            </div>
            <span className="font-bold text-brand-navy">{trust}/100</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${trustColor} transition-all duration-700`} style={{ width: `${trust}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Missions" value={String(missions)} />
          <Stat label="Note" value={rating.toFixed(1)} />
          <Stat label="Avis" value={String(Math.max(missions - 5, 12))} />
        </div>

        {/* Spécialités / badges */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-brand-primary" />
            <span className="font-semibold text-sm text-brand-navy">Spécialités</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s: string) => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-brand-primary-soft text-brand-primary text-xs font-semibold capitalize">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Avis */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="font-semibold text-sm text-brand-navy mb-3">Avis clients</div>
          <div className="space-y-3">
            {[
              { name: "Aïcha K.", rating: 5, comment: "Très ponctuel et travail soigné. Je recommande !" },
              { name: "Modeste B.", rating: 4, comment: "Bon technicien, prix correct." },
            ].map((a, i) => (
              <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-brand-navy">{a.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, n) => (
                      <Star key={n} size={11} className={n < a.rating ? "fill-brand-warning text-brand-warning" : "text-gray-200"} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{a.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-5 bg-gradient-to-t from-brand-bg via-brand-bg to-transparent">
        <button
          onClick={() => navigate(`/app/reservation/${r.id}`)}
          className="w-full bg-brand-primary text-white font-semibold py-4 rounded-2xl shadow-glow-primary active:scale-95 transition-all"
        >
          Réserver maintenant
        </button>
      </div>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-card text-center">
      <div className="text-lg font-bold text-brand-navy">{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
