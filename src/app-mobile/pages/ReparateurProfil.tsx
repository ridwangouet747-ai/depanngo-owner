import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, MapPin, MessageCircle, CalendarCheck, Star, CheckCircle } from "lucide-react";
import { useRepairer } from "../hooks/useRepairers";
import { pickName } from "@/lib/supabaseExternal";

export default function ReparateurProfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: r, isLoading } = useRepairer(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!r) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">😕</div>
          <div className="font-bold text-gray-900">Réparateur introuvable</div>
          <button onClick={() => navigate(-1)} className="mt-4 text-orange-500 font-semibold">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const name = pickName(r as any);
  const trust = Number((r as any).trust_score ?? 75);
  const rating = Number((r as any).average_rating ?? 4.5);
  const missions = Number((r as any).total_missions ?? 0);
  const specialties = Array.isArray((r as any).specialties)
    ? (r as any).specialties
    : [(r as any).specialty ?? "Technicien"];
  const quartier = (r as any).quartier ?? "San Pedro";
  const isAvailable = (r as any).is_available;
  const successRate = Math.min(99, 85 + Math.floor(trust * 0.14));

  const trustColor = trust >= 80
    ? "bg-green-500"
    : trust >= 50
    ? "bg-amber-500"
    : "bg-red-500";

  const FAKE_REVIEWS = [
    { initials: "JB", name: "Jean-Baptiste K.", time: "Il y a 2 jours", comment: "Excellent travail pour la réparation. Très ponctuel et professionnel." },
    { initials: "AM", name: "Aminata M.", time: "Il y a 1 semaine", comment: "Intervention rapide et efficace. Je recommande vivement !" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col pb-32">

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 px-5 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur rounded-full shadow-lg"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <button className="w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur rounded-full shadow-lg">
          <Share2 size={18} className="text-gray-700" />
        </button>
      </div>

      {/* Bannière */}
      <div className="relative w-full h-48 bg-orange-500/10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 flex items-center justify-center">
          <span className="text-[200px] rotate-12">⚡</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-orange-500/20" />
      </div>

      {/* Profile Card */}
      <div className="px-5 -mt-20 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 flex flex-col items-center text-center">

          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="w-24 h-24 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-black text-4xl border-4 border-white shadow-lg">
              {name.charAt(0).toUpperCase()}
            </div>
            {isAvailable && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          <h2 className="text-2xl font-black text-gray-900">{name}</h2>
          <p className="text-orange-500 font-bold text-sm mb-1 uppercase tracking-wider">
            {specialties[0]}
          </p>
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-5">
            <MapPin size={12} className="text-orange-500" />
            <span>{quartier}, San Pedro</span>
          </div>

          {/* Trust Score */}
          <div className="w-full bg-orange-50 rounded-2xl p-4 mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-orange-500 uppercase tracking-wider">Trust Score</span>
              <span className="text-sm font-black text-orange-500">{trust}/100</span>
            </div>
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden">
              <div
                className={`h-full ${trustColor} rounded-full transition-all`}
                style={{ width: `${trust}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-left italic">
              Vérifié par {missions} clients satisfaits
            </p>
          </div>

          {/* Stats */}
          <div className="w-full grid grid-cols-3 gap-2 py-4 border-t border-gray-100">
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-gray-900">{missions}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Missions</span>
            </div>
            <div className="flex flex-col items-center border-x border-gray-100">
              <span className="text-xl font-black text-gray-900">{rating.toFixed(1)}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Note ⭐</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-gray-900">{successRate}%</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Succès</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spécialités */}
      <div className="px-5 mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Spécialités</h3>
        <div className="flex flex-wrap gap-2">
          {specialties.map((s: string, i: number) => (
            <span
              key={i}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700"
            >
              {s}
            </span>
          ))}
          <span className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700">
            Dépannage urgent
          </span>
        </div>
      </div>

      {/* Badge vérifié */}
      {(r as any).is_verified && (
        <div className="px-5 mt-4">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl p-3">
            <CheckCircle size={18} className="text-green-500 shrink-0" />
            <span className="text-sm font-bold text-green-700">
              Identité vérifiée — CNI validée par Dépann'Go
            </span>
          </div>
        </div>
      )}

      {/* Avis clients */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Avis clients</h3>
          <button className="text-orange-500 text-sm font-bold">Tout voir</button>
        </div>
        <div className="space-y-3">
          {FAKE_REVIEWS.map((rev, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-black text-xs">
                    {rev.initials}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{rev.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, n) => (
                    <Star key={n} size={10} className="fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-[10px] text-gray-400 ml-1">{rev.time}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}