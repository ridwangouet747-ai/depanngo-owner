import { createClient } from "@supabase/supabase-js";

// Client Supabase EXTERNE — pointe vers la base DÉPANN'GO de production
// (séparé du Lovable Cloud par défaut du projet)
const SUPABASE_URL = "https://zlmuzknxabuoeilodpad.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsbXV6a254YWJ1b2VpbG9kcGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzI3MjUsImV4cCI6MjA5MjU0ODcyNX0.3MVnf9-m26X1fXXGt2epnEHUQ7aSPi9o_BqgjoXsDtM";

export const supabaseExt = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export const COMMISSION_RATE = 0.07;

// ---------- Types reflétant le schéma de production ----------

export type TxStatus = "completed" | "in_progress" | "dispute" | string;
export type PaymentMethod = "wave" | "orange_money" | "mtn_momo" | string;

export interface DBTransaction {
  id: string;
  city_id: string | null;
  client_id: string | null;
  repairer_id: string | null;
  total_amount_fcfa: number;
  commission_rate: number;
  commission_fcfa: number;
  repairer_amount_fcfa: number;
  service_type: string | null;
  description: string | null;
  payment_method: PaymentMethod | null;
  payment_status: string | null;
  status: TxStatus;
  intervention_quartier: string | null;
  created_at: string;
  completed_at: string | null;
  paid_at: string | null;
}

// Schémas inférés (defensive: tous les champs optionnels sauf id)
export interface DBRepairer {
  id: string;
  full_name?: string | null;
  name?: string | null;
  specialty?: string | null;
  quartier?: string | null;
  rating?: number | null;
  total_revenue_fcfa?: number | null;
  is_active?: boolean | null;
  is_online?: boolean | null;
  repair_count?: number | null;
  city_id?: string | null;
  phone?: string | null;
  [k: string]: unknown;
}

export interface DBProfile {
  id: string;
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
  quartier?: string | null;
  city_id?: string | null;
  repair_count?: number | null;
  total_value_fcfa?: number | null;
  status?: string | null;
  created_at?: string | null;
  [k: string]: unknown;
}

export interface DBDispute {
  id: string;
  transaction_id?: string | null;
  client_id?: string | null;
  repairer_id?: string | null;
  reason?: string | null;
  motif?: string | null;
  opened_at?: string | null;
  created_at?: string | null;
  resolve_before?: string | null;
  deadline_at?: string | null;
  status?: string | null;
  amount_fcfa?: number | null;
  [k: string]: unknown;
}

export interface DBCommission {
  id: string;
  amount_fcfa?: number | null;
  period?: string | null;
  transaction_id?: string | null;
  created_at?: string | null;
  [k: string]: unknown;
}

export interface DBCity {
  id: string;
  name: string;
  country?: string | null;
  region?: string | null;
  is_active?: boolean | null;
  launch_date?: string | null;
  repairer_count?: number | null;
  client_count?: number | null;
  commission_rate?: number | null;
  timezone?: string | null;
  currency?: string | null;
  created_at?: string | null;
}

// ---------- Helpers de formatage ----------

export function formatFCFA(n: number | null | undefined): string {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return new Intl.NumberFormat("fr-FR").format(Math.round(v)) + " FCFA";
}

export function paymentLabel(m: PaymentMethod | null | undefined): string {
  if (m === "wave") return "Wave";
  if (m === "orange_money") return "Orange Money";
  if (m === "mtn_momo") return "MTN MoMo";
  return m ?? "—";
}

export function statusLabel(s: TxStatus): string {
  if (s === "completed") return "Terminé";
  if (s === "in_progress") return "En cours";
  if (s === "dispute") return "Litige";
  return s;
}

// Avatar deterministic color from name
export function avatarColor(name: string): { bg: string; fg: string } {
  const palette = [
    { bg: "hsl(var(--brand-primary-soft))", fg: "hsl(var(--brand-primary))" },
    { bg: "hsl(var(--brand-info-soft))", fg: "hsl(var(--brand-info))" },
    { bg: "hsl(var(--brand-success-soft))", fg: "hsl(var(--brand-success))" },
    { bg: "hsl(var(--brand-warning-soft))", fg: "hsl(var(--brand-warning))" },
    { bg: "hsl(var(--brand-danger-soft))", fg: "hsl(var(--brand-danger))" },
    { bg: "hsl(var(--gray-200))", fg: "hsl(var(--gray-700))" },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// Récupère le nom le mieux disponible parmi plusieurs champs courants
export function pickName(obj: Record<string, unknown> | null | undefined, fallback = "—"): string {
  if (!obj) return fallback;
  return (
    (obj.full_name as string) ||
    (obj.name as string) ||
    (obj.nom as string) ||
    (obj.email as string) ||
    fallback
  );
}

// Quartier détecté
export function pickQuartier(obj: Record<string, unknown> | null | undefined): string {
  if (!obj) return "—";
  return (obj.quartier as string) || (obj.intervention_quartier as string) || "—";
}


// ─────────────────────────────────────
// EDGE FUNCTIONS — Appels depuis le dashboard
// ─────────────────────────────────────

// 1. Diagnostic IA (DEPA)
export async function callDiagnosticIA(
  description: string,
  urgencyLevel: string,
  imageUrl?: string
) {
  const { data, error } = await supabaseExt.functions.invoke("diagnostic-ia", {
    body: { description, urgencyLevel, imageUrl },
  });
  if (error) throw error;
  return data as { diagnostic: string };
}

// 2. Filtre anti-contournement
export async function sendFilteredMessage(
  content: string,
  senderId: string,
  transactionId: string
) {
  const { data, error } = await supabaseExt.functions.invoke("filter-message", {
    body: { content, senderId, transactionId },
  });
  if (error) throw error;
  return data as { blocked: boolean; message: string };
}

// 3. Notification WhatsApp admin
export async function notifyAdmin(
  type: string,
  data: Record<string, unknown>
) {
  const { data: result, error } = await supabaseExt.functions.invoke("notif-whatsapp", {
    body: { type, data },
  });
  if (error) throw error;
  return result;
}

// 4. Calcul acompte
export function calculateDeposit(estimatedPrice: number) {
  let depositRate = 0.50;
  if (estimatedPrice >= 15000 && estimatedPrice <= 50000) depositRate = 0.40;
  else if (estimatedPrice > 50000) depositRate = 0.30;

  const depositAmount     = Math.round(estimatedPrice * depositRate);
  const remainingAmount   = estimatedPrice - depositAmount;
  const commission        = Math.round(estimatedPrice * COMMISSION_RATE);
  const repairerPayout    = estimatedPrice - commission;

  return { depositAmount, remainingAmount, commission, repairerPayout };
}