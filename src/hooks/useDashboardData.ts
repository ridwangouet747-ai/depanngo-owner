import { useQuery } from "@tanstack/react-query";
import {
  supabaseExt,
  COMMISSION_RATE,
  type DBTransaction,
  type DBRepairer,
  type DBProfile,
  type DBDispute,
  type DBCommission,
  type DBCity,
} from "@/lib/supabaseExternal";

// ---------- Queries Supabase ----------

export function useTransactions() {
  return useQuery({
    queryKey: ["ext", "transactions"],
    queryFn: async () => {
      const { data, error } = await supabaseExt
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DBTransaction[];
    },
  });
}

export function useRepairers() {
  return useQuery({
    queryKey: ["ext", "repairers"],
    queryFn: async () => {
      const { data, error } = await supabaseExt.from("repairers").select("*");
      if (error) throw error;
      return (data ?? []) as DBRepairer[];
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["ext", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabaseExt.from("profiles").select("*");
      if (error) throw error;
      return (data ?? []) as DBProfile[];
    },
  });
}

export function useDisputes() {
  return useQuery({
    queryKey: ["ext", "disputes"],
    queryFn: async () => {
      const { data, error } = await supabaseExt.from("disputes").select("*");
      if (error) throw error;
      return (data ?? []) as DBDispute[];
    },
  });
}

export function useCommissions() {
  return useQuery({
    queryKey: ["ext", "owner_commissions"],
    queryFn: async () => {
      const { data, error } = await supabaseExt.from("owner_commissions").select("*");
      if (error) throw error;
      return (data ?? []) as DBCommission[];
    },
  });
}

export function useCities() {
  return useQuery({
    queryKey: ["ext", "cities"],
    queryFn: async () => {
      const { data, error } = await supabaseExt.from("cities").select("*");
      if (error) throw error;
      return (data ?? []) as DBCity[];
    },
  });
}

// ---------- Helpers d'agrégation ----------

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfWeek = () => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfYear = () => {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1);
};

function commissionOf(tx: DBTransaction): number {
  // privilégie la valeur stockée, sinon recalcule à 7%
  if (typeof tx.commission_fcfa === "number" && tx.commission_fcfa > 0) return tx.commission_fcfa;
  const total = Number(tx.total_amount_fcfa) || 0;
  return Math.round(total * COMMISSION_RATE);
}

export interface KPIs {
  commissionsToday: number;
  commissionsMonth: number;
  commissionsLastMonth: number;
  commissionsTodayDelta: number; // %
  commissionsMonthDelta: number; // %
  txToday: number;
  txYesterday: number;
  txTodayDelta: number; // absolute
  rating: number;
  ratingTotal: number;
  clientsTotal: number;
  clientsToday: number;
  reparateursActifs: number;
  reparateursOnline: number;
  litigesOuverts: number;
}

export function computeKpis(
  txs: DBTransaction[],
  reps: DBRepairer[],
  clients: DBProfile[],
  disputes: DBDispute[]
): KPIs {
  const today = startOfToday().getTime();
  const yest = today - 86_400_000;
  const month = startOfMonth().getTime();
  const lastMonthStart = new Date(startOfMonth());
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = startOfMonth().getTime();

  let commissionsToday = 0;
  let commissionsMonth = 0;
  let commissionsLastMonth = 0;
  let txToday = 0;
  let txYesterday = 0;

  for (const tx of txs) {
    const ts = new Date(tx.created_at).getTime();
    const c = commissionOf(tx);
    if (ts >= today) {
      commissionsToday += c;
      txToday++;
    } else if (ts >= yest && ts < today) {
      txYesterday++;
    }
    if (ts >= month) commissionsMonth += c;
    else if (ts >= lastMonthStart.getTime() && ts < lastMonthEnd) commissionsLastMonth += c;
  }

  const commissionsMonthDelta = commissionsLastMonth
    ? Math.round(((commissionsMonth - commissionsLastMonth) / commissionsLastMonth) * 100)
    : 0;

  // Pour les commissions "hier" on prend 0 par défaut
  const commissionsTodayDelta = 0;

  const ratings = reps.map((r) => Number(r.rating)).filter((n) => Number.isFinite(n) && n > 0);
  const rating = ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

  const clientsToday = clients.filter((c) => {
    const ts = c.created_at ? new Date(c.created_at).getTime() : 0;
    return ts >= today;
  }).length;

  const reparateursActifs = reps.filter((r) => r.is_active !== false).length;
  const reparateursOnline = reps.filter((r) => r.is_online === true).length;

  const litigesOuverts = disputes.filter(
    (d) => !d.status || d.status === "open" || d.status === "pending" || d.status === "in_review"
  ).length;

  return {
    commissionsToday,
    commissionsMonth,
    commissionsLastMonth,
    commissionsTodayDelta,
    commissionsMonthDelta,
    txToday,
    txYesterday,
    txTodayDelta: txToday - txYesterday,
    rating,
    ratingTotal: ratings.length,
    clientsTotal: clients.length,
    clientsToday,
    reparateursActifs,
    reparateursOnline,
    litigesOuverts,
  };
}

// Tendance commissions sur 30 jours
export function buildCommissionsTrend(txs: DBTransaction[]) {
  const days = 30;
  const today = startOfToday();
  const buckets = new Map<string, { commission: number; volume: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), { commission: 0, volume: 0 });
  }
  for (const tx of txs) {
    const key = new Date(tx.created_at).toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    b.commission += commissionOf(tx);
    b.volume += Number(tx.total_amount_fcfa) || 0;
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({ date, commission: v.commission, volume: v.volume }));
}

// Transactions par quartier
export function buildByQuartier(txs: DBTransaction[]) {
  const map = new Map<string, { value: number; volume: number }>();
  for (const tx of txs) {
    const q = tx.intervention_quartier || "—";
    const e = map.get(q) ?? { value: 0, volume: 0 };
    e.value++;
    e.volume += Number(tx.total_amount_fcfa) || 0;
    map.set(q, e);
  }
  return Array.from(map.entries())
    .map(([quartier, v]) => ({ quartier, value: v.value, volume: v.volume }))
    .sort((a, b) => b.volume - a.volume);
}

// Répartition paiements
export function buildPaiementsRepartition(txs: DBTransaction[]) {
  const counts: Record<string, number> = { wave: 0, orange_money: 0, mtn_momo: 0 };
  for (const tx of txs) {
    const m = (tx.payment_method as string) || "wave";
    counts[m] = (counts[m] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return [
    { name: "Wave", value: Math.round((counts.wave / total) * 100), color: "hsl(var(--brand-info))" },
    { name: "Orange Money", value: Math.round((counts.orange_money / total) * 100), color: "hsl(var(--brand-primary))" },
    { name: "MTN MoMo", value: Math.round((counts.mtn_momo / total) * 100), color: "hsl(var(--brand-warning))" },
  ];
}

// Revenus par période
export function buildRevenusBreakdown(txs: DBTransaction[], commissionsRows: DBCommission[]) {
  const now = Date.now();
  const wk = startOfWeek().getTime();
  const lastWkStart = wk - 7 * 86_400_000;
  const mo = startOfMonth().getTime();
  const lastMo = new Date(startOfMonth());
  lastMo.setMonth(lastMo.getMonth() - 1);
  const yr = startOfYear().getTime();

  // Si owner_commissions a des données, les privilégier
  const useStored = commissionsRows.length > 0;
  const sumStored = (from: number, to: number) =>
    commissionsRows
      .filter((c) => {
        const t = c.created_at ? new Date(c.created_at).getTime() : 0;
        return t >= from && t < to;
      })
      .reduce((s, c) => s + (Number(c.amount_fcfa) || 0), 0);

  const sumCommission = (from: number, to: number) =>
    txs
      .filter((tx) => {
        const t = new Date(tx.created_at).getTime();
        return t >= from && t < to;
      })
      .reduce((s, tx) => s + commissionOf(tx), 0);

  const sumVolume = (from: number, to: number) =>
    txs
      .filter((tx) => {
        const t = new Date(tx.created_at).getTime();
        return t >= from && t < to;
      })
      .reduce((s, tx) => s + (Number(tx.total_amount_fcfa) || 0), 0);

  const countTx = (from: number, to: number) =>
    txs.filter((tx) => {
      const t = new Date(tx.created_at).getTime();
      return t >= from && t < to;
    }).length;

  const semaine = useStored ? sumStored(wk, now) : sumCommission(wk, now);
  const mois = useStored ? sumStored(mo, now) : sumCommission(mo, now);
  const annee = useStored ? sumStored(yr, now) : sumCommission(yr, now);

  const periods = [
    { periode: "Cette semaine", from: wk, to: now },
    { periode: "Semaine dernière", from: lastWkStart, to: wk },
    { periode: "Ce mois", from: mo, to: now },
    { periode: "Mois dernier", from: lastMo.getTime(), to: mo },
    { periode: "Cette année", from: yr, to: now },
  ];

  return {
    breakdown: { semaine, mois, annee, soldeEstime: mois },
    byPeriod: periods.map((p) => ({
      periode: p.periode,
      brut: sumVolume(p.from, p.to),
      commission: useStored ? sumStored(p.from, p.to) : sumCommission(p.from, p.to),
      txCount: countTx(p.from, p.to),
    })),
  };
}
