// Point d'entrée unifié pour les clients Supabase
// - supabaseClient : session persistante (app mobile, auth)
// - supabaseExt : session non persistante (queries data, dashboard)

export { supabaseClient } from "./supabaseClient";
export { supabaseExt } from "./supabaseExternal";
export {
  COMMISSION_RATE,
  formatFCFA,
  paymentLabel,
  statusLabel,
  avatarColor,
  pickName,
  pickQuartier,
  callDiagnosticIA,
  sendFilteredMessage,
  notifyAdmin,
  calculateDeposit,
} from "./supabaseExternal";
export type {
  TxStatus,
  PaymentMethod,
  DBTransaction,
  DBRepairer,
  DBProfile,
  DBDispute,
  DBCommission,
  DBCity,
} from "./supabaseExternal";
