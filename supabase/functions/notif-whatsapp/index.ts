Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { type, data } = await req.json();

    const TWILIO_SID   = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const ADMIN_PHONE  = Deno.env.get("ADMIN_PHONE")!;

    const message = buildMessage(type, data);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: "whatsapp:+14155238886",
          To:   `whatsapp:+225${ADMIN_PHONE}`,
          Body: message,
        }),
      }
    );

    const result = await response.json();

    return new Response(JSON.stringify({ sent: true, result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});

function buildMessage(type: string, data: Record<string, unknown>): string {
  switch (type) {

    case "new_transaction":
      return `
🔧 *DÉPANN'GO — Nouvelle demande*

📍 Quartier : ${data.quartier ?? "—"}
🛠️ Service : ${data.service_type ?? "—"}
🚨 Urgence : ${String(data.urgency_level ?? "—").toUpperCase()}
👤 Client : ${data.client_name ?? "—"}
📞 Téléphone : ${data.client_phone ?? "—"}
💰 Montant estimé : ${data.amount ?? "—"} FCFA

🔗 Dashboard : https://depanngo.vercel.app
      `.trim();

    case "new_payment":
      return `
💰 *DÉPANN'GO — Paiement reçu*

💳 Montant total : ${data.amount ?? "—"} FCFA
📊 Ta commission (7%) : *${data.commission ?? "—"} FCFA*
💳 Méthode : ${String(data.payment_method ?? "—").toUpperCase()}

🔗 Dashboard : https://depanngo.vercel.app
      `.trim();

    case "new_repairer":
      return `
👤 *DÉPANN'GO — Nouveau réparateur*

Nom : ${data.full_name ?? "—"}
Spécialités : ${data.specialties ?? "—"}
📞 Téléphone : ${data.phone ?? "—"}
📍 Quartier : ${data.quartier ?? "—"}

⚠️ En attente de validation.
🔗 Valider : https://depanngo.vercel.app
      `.trim();

    case "new_dispute":
      return `
⚠️ *DÉPANN'GO — Nouveau litige*

Raison : ${data.reason ?? "—"}
Transaction : ${data.transaction_id ?? "—"}

🔗 Arbitrer : https://depanngo.vercel.app
      `.trim();

    case "trust_score_critical":
      return `
🔴 *DÉPANN'GO — Trust Score Critique*

Réparateur suspendu automatiquement.
ID : ${data.repairer_id ?? "—"}
Score : ${data.score ?? "—"}/100

⚠️ Intervention requise.
🔗 Dashboard : https://depanngo.vercel.app
      `.trim();

    case "daily_summary":
      return `
📊 *DÉPANN'GO — Résumé du ${data.date ?? "—"}*

━━━━━━━━━━━━━━━━━━━━
📋 Transactions : ${data.total ?? "—"}
✅ Complétées : ${data.completed ?? "—"}
❌ Annulées : ${data.cancelled ?? "—"}
━━━━━━━━━━━━━━━━━━━━
💰 Volume : ${data.volume ?? "—"} FCFA
📊 Commissions : *${data.commission ?? "—"} FCFA*
━━━━━━━━━━━━━━━━━━━━
⭐ Note moyenne : ${data.rating ?? "—"}/5
      `.trim();

    default:
      return `📱 *DÉPANN'GO* — Notification : ${type}`;
  }
}