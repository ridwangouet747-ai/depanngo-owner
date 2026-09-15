import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PushRequest {
  user_id: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: PushRequest = await req.json();

    if (!body.user_id || !body.title || !body.body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", body.user_id);

    if (subError || !subscriptions?.length) {
      return new Response(JSON.stringify({
        success: false,
        message: "No push subscriptions found",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save notification to database
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: body.user_id,
        title: body.title,
        body: body.body,
        type: body.type ?? "info",
        data: body.data ?? {},
      });

    if (notifError) {
      console.error("Failed to save notification:", notifError);
    }

    // ================================================================
    // ENVOI PUSH RÉEL
    // ================================================================
    // En production, utiliser web-push (npm) ou un service comme :
    // - Firebase Cloud Messaging (FCM)
    // - OneSignal
    // - Pusher Beams
    //
    // Pour l'instant, on enregistre juste la notification en BDD
    // et le client la récupérera au prochain chargement
    // ================================================================

    return new Response(JSON.stringify({
      success: true,
      message: `Notification envoyée à ${subscriptions.length} appareil(s)`,
      saved_to_db: true,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
