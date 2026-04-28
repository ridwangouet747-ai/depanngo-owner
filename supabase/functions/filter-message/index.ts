import { createClient } from "npm:@supabase/supabase-js";

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
    const { content, senderId, transactionId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Vérifier les patterns interdits
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
      // Logger dans fraud_logs
      await supabase.from("fraud_logs").insert({
        user_id: senderId,
        transaction_id: transactionId,
        type: "bypass_attempt",
        severity: "medium",
        details: { message: content },
      });

      // Réduire trust score
      await supabase.rpc("decrease_trust_score", {
        p_user_id: senderId,
        p_points: 15,
      });

      return new Response(
        JSON.stringify({
          blocked: true,
          message:
            "🚫 Message bloqué. Les échanges de coordonnées sont interdits sur Dépann'Go.",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Message propre → sauvegarder
    const { data, error } = await supabase
      .from("messages")
      .insert({
        transaction_id: transactionId,
        sender_id: senderId,
        content,
        is_flagged: false,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ blocked: false, message: data }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
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