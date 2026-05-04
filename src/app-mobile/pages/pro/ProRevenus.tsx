import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Wallet, Calendar } from "lucide-react";
import { supabaseExt, formatFCFA } from "@/lib/supabaseExternal";
import { useAuthClient } from "../../hooks/useAuthClient";
import ProBottomNav from "./ProBottomNav";
import { useQuery } from "@tanstack/react-query";

export default function ProRevenus() {
  const navigate = useNavigate();
  const { user } = useAuthClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["pro-revenus", user?.id],
    queryFn: async () => {
      const { data } = await supabaseExt
        .from("transactions")
        .select("*")
        .eq("repairer_id", user?.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const totalRevenu = transactions.reduce(
    (sum: number, t: any) => sum + (Number(t.repairer_amount_fcfa) || 0), 0
  );
  const thisMonth = transactions
    .filter((t: any) => new Date(t.created_at).getMonth() === new Date().getMonth())
    .reduce((sum: number, t: any) => sum + (Number(t.repairer_amount_fcfa) || 0), 0);
  const thisWeek = transactions
    .filter((t: any) => {
      const diff = (Date.now() - new Date(t.created_at).getTime()) / 86400000;
      return diff <= 7;
    })
    .reduce((sum: number, t: any) => sum + (Number(t.repairer_amount_fcfa) || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">

      {/* Header orange */}
      <div className="bg-orange-500 px-5 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h1 className="text-white text-2xl font-black">Mes Revenus</h1>
        </div>
        <div className="text-center">
          <p className="text-orange-100 text-sm font-medium mb-1">Total cumulé</p>
          <p className="text-white text-4xl font-black">{formatFCFA(totalRevenu)}</p>
          <p className="text-orange-100 text-xs mt-1">{transactions.length} missions complétées</p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-2 divide-x divide-gray-100">
          <div className="flex flex-col items-center gap-1 pr-4">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <span className="font-black text-gray-900 text-sm">{formatFCFA(thisMonth)}</span>
            <span className="text-[10px] text-gray-400 uppercase font-bold">Ce mois</span>
          </div>
          <div className="flex flex-col items-center gap-1 pl-4">
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <span className="font-black text-gray-900 text-sm">{formatFCFA(thisWeek)}</span>
            <span className="text-[10px] text-gray-400 uppercase font-bold">Cette semaine</span>
          </div>
        </div>
      </div>

      {/* Info commission */}
      <div className="px-5 mt-4">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
          <Wallet size={20} className="text-orange-500 shrink-0" />
          <p className="text-xs text-orange-700 font-medium">
            Dépann'Go prélève <strong>7%</strong> de commission. Vous recevez <strong>93%</strong> du montant total.
          </p>
        </div>
      </div>

      {/* Historique */}
      <div className="px-5 mt-6">
        <h2 className="font-black text-gray-900 text-lg mb-4">Historique des paiements</h2>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse mb-3" />
          ))
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💰</div>
            <p className="font-bold text-gray-900">Aucun revenu pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">Complétez des missions pour voir vos revenus ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t: any) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center font-black text-lg">✓</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.service_type ?? "Mission"}</p>
                    <p className="text-xs text-gray-400">
                      {t.intervention_quartier ?? "San Pedro"} • {new Date(t.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-600 text-sm">+{formatFCFA(Number(t.repairer_amount_fcfa) || 0)}</p>
                  <p className="text-[10px] text-gray-400">{t.payment_method?.toUpperCase() ?? "WAVE"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ProBottomNav />
    </div>
  );
}