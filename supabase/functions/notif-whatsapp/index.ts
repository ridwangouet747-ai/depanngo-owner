const ALLOWED_ORIGIN = "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { type, data } = await req.json();

    if (!type || typeof type !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'type'" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const ALLOWED_TYPES = [
      "new_transaction", "new_payment", "new_repairer",
      "new_dispute", "trust_score_critical", "daily_summary",
    ];
    if (!ALLOWED_TYPES.includes(type)) {
      return new Response(JSON.stringify({ error: "Unknown notification type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!data || typeof data !== "object") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'data'" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const TWILIO_SID   = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const ADMIN_PHONE  = Deno.env.get("ADMIN_PHONE")!;

    if (!TWILIO_SID || !TWILIO_TOKEN || !ADMIN_PHONE) {
      throw new Error("Twilio environment variables not configured");
    }

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

    return new Response(JSON.stringify({ sent: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

function sanitize(str: unknown): string {
  if (typeof str !== "string") return "—";
  return str.replace(/[<>"'&]/g, "").slice(0, 200);
}

function buildMessage(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case "new_transaction":
      return [
        "🔧 *DÉPANN'GO — Nouvelle demande*",
        "",
        `📍 Quartier : ${sanitize(data.quartier)}`,
        `🛠️ Service : ${sanitize(data.service_type)}`,
        `🚨 Urgence : ${sanitize(data.urgency_level).toUpperCase()}`,
        `👤 Client : ${sanitize(data.client_name)}`,
        `📞 Téléphone : ${sanitize(data.client_phone)}`,
        `💰 Montant estimé : ${sanitize(data.amount)} FCFA`,
        "",
        "🔗 Dashboard : https://depanngo.vercel.app",
      ].join("\n");

    case "new_payment":
      return [
        "💰 *DÉPANN'GO — Paiement reçu*",
        "",
        `💳 Montant total : ${sanitize(data.amount)} FCFA`,
        `📊 Commission (7%) : *${sanitize(data.commission)} FCFA*`,
        `💳 Méthode : ${sanitize(data.payment_method).toUpperCase()}`,
        "",
        "🔗 Dashboard : https://depanngo.vercel.app",
      ].join("\n");

    case "new_repairer":
      return [
        "👤 *DÉPANN'GO — Nouveau réparateur*",
        "",
        `Nom : ${sanitize(data.full_name)}`,
        `Spécialités : ${sanitize(data.specialties)}`,
        `📞 Téléphone : ${sanitize(data.phone)}`,
        `📍 Quartier : ${sanitize(data.quartier)}`,
        "",
        "⚠️ En attente de validation.",
        "🔗 Valider : https://depanngo.vercel.app",
      ].join("\n");

    case "new_dispute":
      return [
        "⚠️ *DÉPANN'GO — Nouveau litige*",
        "",
        `Raison : ${sanitize(data.reason)}`,
        `Transaction : ${sanitize(data.transaction_id)}`,
        "",
        "🔗 Arbitrer : https://depanngo.vercel.app",
      ].join("\n");

    case "trust_score_critical":
      return [
        "🔴 *DÉPANN'GO — Trust Score Critique*",
        "",
        "Réparateur suspendu automatiquement.",
        `ID : ${sanitize(data.repairer_id)}`,
        `Score : ${sanitize(data.score)}/100`,
        "",
        "⚠️ Intervention requise.",
        "🔗 Dashboard : https://depanngo.vercel.app",
      ].join("\n");

    case "daily_summary":
      return [
        `📊 *DÉPANN'GO — Résumé du ${sanitize(data.date)}*`,
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        `📋 Transactions : ${sanitize(data.total)}`,
        `✅ Complétées : ${sanitize(data.completed)}`,
        `❌ Annulées : ${sanitize(data.cancelled)}`,
        "━━━━━━━━━━━━━━━━━━━━",
        `💰 Volume : ${sanitize(data.volume)} FCFA`,
        `📊 Commissions : *${sanitize(data.commission)} FCFA*`,
        "━━━━━━━━━━━━━━━━━━━━",
        `⭐ Note moyenne : ${sanitize(data.rating)}/5`,
      ].join("\n");

    default:
      return `📱 *DÉPANN'GO* — Notification`;
  }
}
