import { createClient } from "npm:@supabase/supabase-js";

const ALLOWED_ORIGIN = "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const BYPASS_PATTERNS = [
  /\b0[0-9]{9}\b/g,
  /\b\+225\s?[0-9]{10}\b/g,
  /whatsapp/gi,
  /wa\.me/gi,
  /appelle[\s-]moi/gi,
  /mon[\s-]numéro/gi,
  /telegram/gi,
  /hors[\s-]application/gi,
  /sans[\s-]passer[\s-]par/gi,
  /en[\s-]dehors/gi,
  /contacte[\s-]moi/gi,
];

const MAX_MESSAGE_LENGTH = 2000;

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
    const { content, senderId, transactionId } = await req.json();

    if (!content || typeof content !== "string" || content.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing content (max 2000 chars)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!senderId || typeof senderId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid senderId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!transactionId || typeof transactionId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid transactionId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let flagged = false;
    let flagReason = "";

    for (const pattern of BYPASS_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        flagged = true;
        flagReason = "bypass_attempt";
        break;
      }
    }

    if (flagged) {
      await supabase.from("fraud_logs").insert({
        user_id: senderId,
        transaction_id: transactionId,
        type: "bypass_attempt",
        severity: "medium",
        details: { message: content.slice(0, 500) },
      });

      await supabase.rpc("decrease_trust_score", {
        p_user_id: senderId,
        p_points: 15,
      });

      return new Response(
        JSON.stringify({
          blocked: true,
          message: "🚫 Message bloqué. Les échanges de coordonnées sont interdits sur Dépann'Go.",
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        transaction_id: transactionId,
        sender_id: senderId,
        content: content.slice(0, MAX_MESSAGE_LENGTH),
        is_flagged: false,
      })
      .select("id, transaction_id, sender_id, content, created_at, is_flagged")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ blocked: false, message: data }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
