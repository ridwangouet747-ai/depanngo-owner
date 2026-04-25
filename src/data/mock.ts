export type TxStatus = "completed" | "in_progress" | "dispute";
export type PaymentMethod = "wave" | "orange_money" | "mtn_momo";

export type Quartier =
  | "Bardot" | "Cité" | "Kpwesso" | "Moro" | "Lac" | "Zone Industrielle" | "San Pedro Port";

export const QUARTIERS: Quartier[] = [
  "Bardot", "Cité", "Kpwesso", "Moro", "Lac", "Zone Industrielle", "San Pedro Port",
];

export interface Transaction {
  id: string;
  date: string; // ISO
  client: string;
  service: string;
  quartier: Quartier;
  montant: number; // FCFA
  payment: PaymentMethod;
  status: TxStatus;
  reparateur: string;
}

export interface Reparateur {
  id: string;
  nom: string;
  specialite: string;
  quartier: Quartier;
  rating: number; // 0-5
  revenusGeneres: number; // FCFA total platform GMV
  active: boolean;
  online: boolean;
  reparations: number;
}

export interface Client {
  id: string;
  nom: string;
  telephone: string; // masked
  quartier: Quartier;
  reparations: number;
  valeurTotale: number; // FCFA
  status: "actif" | "inactif";
}

export interface Litige {
  id: string;
  client: string;
  reparateur: string;
  service: string;
  montant: number;
  ouvertDepuis: string; // ISO
  resolveBefore: string; // ISO
  motif: string;
}

export const transactions: Transaction[] = [
  { id: "TX-2418", date: "2025-04-25T11:42:00", client: "Koné Mamadou", service: "Réparation moto", quartier: "Bardot", montant: 25000, payment: "wave", status: "completed", reparateur: "Traoré Youssouf" },
  { id: "TX-2417", date: "2025-04-25T10:18:00", client: "Bamba Fatoumata", service: "Téléphone cassé", quartier: "Kpwesso", montant: 15000, payment: "orange_money", status: "completed", reparateur: "Konaté Salif" },
  { id: "TX-2416", date: "2025-04-25T09:55:00", client: "Touré Ibrahim", service: "Groupe électrogène", quartier: "Zone Industrielle", montant: 75000, payment: "wave", status: "in_progress", reparateur: "Traoré Youssouf" },
  { id: "TX-2415", date: "2025-04-25T09:12:00", client: "Coulibaly Aïcha", service: "Climatiseur", quartier: "Cité", montant: 50000, payment: "mtn_momo", status: "completed", reparateur: "Ouattara Bintou" },
  { id: "TX-2414", date: "2025-04-25T08:30:00", client: "Diallo Seydou", service: "Réfrigérateur", quartier: "Moro", montant: 35000, payment: "wave", status: "dispute", reparateur: "Ouattara Bintou" },
  { id: "TX-2413", date: "2025-04-24T17:48:00", client: "N'Guessan Rachelle", service: "Plomberie", quartier: "Lac", montant: 18000, payment: "orange_money", status: "completed", reparateur: "Yao Christophe" },
  { id: "TX-2412", date: "2025-04-24T16:05:00", client: "Sangaré Drissa", service: "Électricité maison", quartier: "Bardot", montant: 42000, payment: "wave", status: "completed", reparateur: "Yao Christophe" },
  { id: "TX-2411", date: "2025-04-24T14:20:00", client: "Konan Adjoa", service: "Machine à laver", quartier: "Cité", montant: 28000, payment: "mtn_momo", status: "completed", reparateur: "Ouattara Bintou" },
  { id: "TX-2410", date: "2025-04-24T12:55:00", client: "Bakayoko Issa", service: "Téléviseur", quartier: "Kpwesso", montant: 22000, payment: "orange_money", status: "completed", reparateur: "Konaté Salif" },
  { id: "TX-2409", date: "2025-04-24T11:10:00", client: "Cissé Marietou", service: "Réparation moto", quartier: "San Pedro Port", montant: 31000, payment: "wave", status: "completed", reparateur: "Traoré Youssouf" },
  { id: "TX-2408", date: "2025-04-23T17:00:00", client: "Ouédraogo Pascal", service: "Soudure portail", quartier: "Zone Industrielle", montant: 65000, payment: "wave", status: "completed", reparateur: "Yao Christophe" },
  { id: "TX-2407", date: "2025-04-23T15:30:00", client: "Touré Awa", service: "Climatiseur", quartier: "Lac", montant: 48000, payment: "mtn_momo", status: "completed", reparateur: "Ouattara Bintou" },
];

export const reparateurs: Reparateur[] = [
  { id: "R-01", nom: "Traoré Youssouf", specialite: "Moto & Groupes électrogènes", quartier: "Bardot", rating: 4.9, revenusGeneres: 127500, active: true, online: true, reparations: 47 },
  { id: "R-02", nom: "Konaté Salif", specialite: "Téléphones & Électronique", quartier: "Kpwesso", rating: 4.7, revenusGeneres: 89250, active: true, online: true, reparations: 38 },
  { id: "R-03", nom: "Ouattara Bintou", specialite: "Froid & Climatisation", quartier: "Zone Industrielle", rating: 4.8, revenusGeneres: 203000, active: true, online: true, reparations: 62 },
  { id: "R-04", nom: "Yao Christophe", specialite: "Plomberie & Électricité", quartier: "Cité", rating: 4.6, revenusGeneres: 156800, active: true, online: false, reparations: 51 },
  { id: "R-05", nom: "Diaby Mamadou", specialite: "Soudure & Métallerie", quartier: "Zone Industrielle", rating: 4.5, revenusGeneres: 98400, active: true, online: true, reparations: 29 },
  { id: "R-06", nom: "Soro Adama", specialite: "Électroménager", quartier: "Moro", rating: 4.4, revenusGeneres: 67200, active: true, online: false, reparations: 24 },
  { id: "R-07", nom: "Kouassi Patrick", specialite: "Informatique & Réseaux", quartier: "Lac", rating: 4.8, revenusGeneres: 145000, active: true, online: true, reparations: 41 },
  { id: "R-08", nom: "Camara Mohamed", specialite: "Moto & Vélo", quartier: "San Pedro Port", rating: 4.3, revenusGeneres: 54100, active: false, online: false, reparations: 18 },
];

export const clients: Client[] = [
  { id: "C-001", nom: "Koné Mamadou", telephone: "07 88 ** ** 89", quartier: "Bardot", reparations: 3, valeurTotale: 75000, status: "actif" },
  { id: "C-002", nom: "Bamba Fatoumata", telephone: "05 44 ** ** 12", quartier: "Kpwesso", reparations: 1, valeurTotale: 15000, status: "actif" },
  { id: "C-003", nom: "Touré Ibrahim", telephone: "01 23 ** ** 56", quartier: "Zone Industrielle", reparations: 2, valeurTotale: 125000, status: "actif" },
  { id: "C-004", nom: "Coulibaly Aïcha", telephone: "07 11 ** ** 34", quartier: "Cité", reparations: 4, valeurTotale: 168000, status: "actif" },
  { id: "C-005", nom: "Diallo Seydou", telephone: "05 67 ** ** 90", quartier: "Moro", reparations: 2, valeurTotale: 70000, status: "actif" },
  { id: "C-006", nom: "N'Guessan Rachelle", telephone: "01 45 ** ** 78", quartier: "Lac", reparations: 5, valeurTotale: 92000, status: "actif" },
  { id: "C-007", nom: "Sangaré Drissa", telephone: "07 99 ** ** 21", quartier: "Bardot", reparations: 3, valeurTotale: 121000, status: "actif" },
  { id: "C-008", nom: "Konan Adjoa", telephone: "05 22 ** ** 65", quartier: "Cité", reparations: 1, valeurTotale: 28000, status: "inactif" },
  { id: "C-009", nom: "Bakayoko Issa", telephone: "01 88 ** ** 09", quartier: "Kpwesso", reparations: 2, valeurTotale: 47000, status: "actif" },
  { id: "C-010", nom: "Cissé Marietou", telephone: "07 33 ** ** 47", quartier: "San Pedro Port", reparations: 1, valeurTotale: 31000, status: "actif" },
];

export const litiges: Litige[] = [
  {
    id: "LT-001",
    client: "Diallo Seydou",
    reparateur: "Ouattara Bintou",
    service: "Réfrigérateur",
    montant: 35000,
    ouvertDepuis: "2025-04-25T08:30:00",
    resolveBefore: "2025-04-26T08:30:00",
    motif: "Le réfrigérateur ne refroidit toujours pas après intervention. Client demande remboursement.",
  },
  {
    id: "LT-002",
    client: "Konan Adjoa",
    reparateur: "Soro Adama",
    service: "Machine à laver",
    montant: 28000,
    ouvertDepuis: "2025-04-25T13:15:00",
    resolveBefore: "2025-04-26T13:15:00",
    motif: "Pièce remplacée mais panne identique sous 24h. Réparateur affirme défaut d'usage.",
  },
];

// 30 jours de commissions (croissance ~15k → 85k)
export const commissionsTrend = (() => {
  const days = 30;
  const data: { date: string; commission: number; volume: number }[] = [];
  const today = new Date("2025-04-25");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // base growth + noise
    const t = (days - 1 - i) / (days - 1);
    const base = 15000 + t * 70000;
    const noise = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * 6000;
    const weekend = d.getDay() === 0 || d.getDay() === 6 ? -8000 : 0;
    const commission = Math.max(8000, Math.round(base + noise + weekend));
    data.push({
      date: d.toISOString().slice(0, 10),
      commission,
      volume: Math.round(commission / 0.07),
    });
  }
  return data;
})();

// Transactions par quartier (volume FCFA cumulé sur 30j)
export const transactionsByQuartier = [
  { quartier: "Bardot", value: 28, volume: 720000 },
  { quartier: "Cité", value: 24, volume: 645000 },
  { quartier: "Kpwesso", value: 19, volume: 412000 },
  { quartier: "Moro", value: 12, volume: 285000 },
  { quartier: "Lac", value: 16, volume: 380000 },
  { quartier: "Z. Industrielle", value: 22, volume: 1180000 },
  { quartier: "S.P. Port", value: 9, volume: 195000 },
];

// Méthode de paiement (camembert)
export const paiementsRepartition = [
  { name: "Wave", value: 58, color: "hsl(var(--brand-info))" },
  { name: "Orange Money", value: 27, color: "hsl(var(--brand-primary))" },
  { name: "MTN MoMo", value: 15, color: "hsl(var(--brand-warning))" },
];

export const COMMISSION_RATE = 0.07;

// KPIs principaux
export const kpis = {
  commissionsToday: 47250,
  commissionsTodayDelta: 18, // %
  commissionsMonth: 1240500,
  commissionsMonthDelta: 34,
  txToday: 8,
  txTodayDelta: 3, // absolute
  rating: 4.7,
  ratingTotal: 312, // nb d'avis
  clientsTotal: 127,
  clientsToday: 5,
  reparateursActifs: 23,
  reparateursOnline: 18,
  litigesOuverts: 2,
};

// Revenus hebdo / mensuels / annuels
export const revenusBreakdown = {
  semaine: 287400,
  mois: 1240500,
  annee: 8920000,
  soldeEstime: 1240500,
};

// Liste pour la page Revenus
export const commissionsByPeriod = [
  { periode: "Cette semaine", brut: 4105714, commission: 287400, txCount: 47 },
  { periode: "Semaine dernière", brut: 3678571, commission: 257500, txCount: 42 },
  { periode: "Ce mois", brut: 17721429, commission: 1240500, txCount: 198 },
  { periode: "Mois dernier", brut: 13218571, commission: 925300, txCount: 161 },
  { periode: "Cette année", brut: 127428571, commission: 8920000, txCount: 1408 },
];

export function formatFCFA(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export function paymentLabel(m: PaymentMethod): string {
  return m === "wave" ? "Wave" : m === "orange_money" ? "Orange Money" : "MTN MoMo";
}

export function paymentColor(m: PaymentMethod): string {
  return m === "wave" ? "info" : m === "orange_money" ? "primary" : "warning";
}

export function statusLabel(s: TxStatus): string {
  return s === "completed" ? "Terminé" : s === "in_progress" ? "En cours" : "Litige";
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

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
