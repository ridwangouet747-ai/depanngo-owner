import { formatFCFA, COMMISSION_RATE } from "./supabaseExternal";

interface ExportRow {
  id: string;
  created_at: string;
  clientName: string;
  repairerName: string;
  service_type: string;
  intervention_quartier: string;
  total_amount_fcfa: number;
  commission_fcfa: number;
  payment_method: string;
  status: string;
}

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function exportTransactionsCSV(rows: ExportRow[], filename?: string) {
  const headers = [
    "ID",
    "Date",
    "Client",
    "Réparateur",
    "Service",
    "Quartier",
    "Montant (FCFA)",
    "Commission (FCFA)",
    "Méthode paiement",
    "Statut",
  ];

  const statusLabels: Record<string, string> = {
    completed: "Terminé",
    in_progress: "En cours",
    pending: "En attente",
    dispute: "Litige",
    cancelled: "Annulé",
  };

  const payLabels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    mtn_momo: "MTN MoMo",
    cash: "Espèces",
  };

  const csvRows = rows.map((r) => [
    r.id,
    formatDate(r.created_at),
    escapeCSV(r.clientName),
    escapeCSV(r.repairerName),
    escapeCSV(r.service_type ?? "—"),
    escapeCSV(r.intervention_quartier ?? "—"),
    String(r.total_amount_fcfa),
    String(r.commission_fcfa || Math.round(r.total_amount_fcfa * COMMISSION_RATE)),
    payLabels[r.payment_method] ?? r.payment_method,
    statusLabels[r.status] ?? r.status,
  ]);

  const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `transactions_depanngo_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsExcel(rows: ExportRow[], filename?: string) {
  const headers = [
    "ID",
    "Date",
    "Client",
    "Réparateur",
    "Service",
    "Quartier",
    "Montant (FCFA)",
    "Commission (FCFA)",
    "Méthode paiement",
    "Statut",
  ];

  const statusLabels: Record<string, string> = {
    completed: "Terminé",
    in_progress: "En cours",
    pending: "En attente",
    dispute: "Litige",
    cancelled: "Annulé",
  };

  const payLabels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    mtn_momo: "MTN MoMo",
    cash: "Espèces",
  };

  const xmlRows = rows.map((r) => {
    const cells = [
      r.id,
      formatDate(r.created_at),
      r.clientName,
      r.repairerName,
      r.service_type ?? "—",
      r.intervention_quartier ?? "—",
      r.total_amount_fcfa,
      r.commission_fcfa || Math.round(r.total_amount_fcfa * COMMISSION_RATE),
      payLabels[r.payment_method] ?? r.payment_method,
      statusLabels[r.status] ?? r.status,
    ];
    return `<Row>${cells.map((c) => `<Cell><Data ss:Type="Number">${typeof c === "number" ? c : String(c).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Data></Cell>`).join("")}</Row>`;
  });

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Transactions">
    <Table>
      <Row>${headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("")}</Row>
      ${xmlRows.join("\n      ")}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `transactions_depanngo_${new Date().toISOString().slice(0, 10)}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}
