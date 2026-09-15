import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PaymentRequest {
  transaction_id: string;
  provider: "wave" | "orange_money" | "mtn_momo";
  amount_fcfa: number;
  type: "deposit" | "balance" | "refund";
  phone_number: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: PaymentRequest = await req.json();

    // Validation
    if (!body.transaction_id || !body.provider || !body.amount_fcfa || !body.phone_number) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.amount_fcfa < 100 || body.amount_fcfa > 500000) {
      return new Response(JSON.stringify({ error: "Amount out of range (100-500,000 FCFA)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize phone number
    const phone = body.phone_number.replace(/[^0-9]/g, "");

    // Verify transaction exists and belongs to user
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("id, client_id, amount")
      .eq("id", body.transaction_id)
      .eq("client_id", user.id)
      .single();

    if (txError || !transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        transaction_id: body.transaction_id,
        user_id: user.id,
        provider: body.provider,
        amount_fcfa: body.amount_fcfa,
        type: body.type,
        phone_number: phone,
        status: "pending",
      })
      .select("id")
      .single();

    if (paymentError) {
      return new Response(JSON.stringify({ error: "Failed to create payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ================================================================
    // INTÉGRATION PAIEMENT MOBILE MONEY
    // ================================================================
    // En production, intégrer ici l'API du provider :
    //
    // Wave: https://developers.wave.com/
    //   POST https://api.wave.com/v1/merchant/sections/{section_id}/payments
    //
    // Orange Money: https://developer.orange.com/
    //   POST https://api.orange.com/orange-money-webpay/cm/v1/webpayment
    //
    // MTN MoMo: https://momodeveloper.mtn.com/
    //   POST https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay
    //
    // Pour l'instant, on simule un succès après 2 secondes
    // ================================================================

    // Simulate payment processing (replace with real API call)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update payment status to completed
    const { error: updateError } = await supabase.rpc("update_payment_status", {
      p_payment_id: payment.id,
      p_status: "completed",
      p_provider_ref: `SIM-${Date.now()}`,
    });

    if (updateError) {
      console.error("Failed to update payment status:", updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      status: "completed",
      message: `Paiement de ${body.amount_fcfa} FCFA via ${body.provider} confirmé`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
